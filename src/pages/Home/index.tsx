import { useCallback, useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import styles from "./index.module.less";
import "@/lib/eraser_brush.mixin.js";
import {
  ColorPicker,
  GetProp,
  message,
  Radio,
  RadioChangeEvent,
  Upload,
  UploadProps,
} from "antd";
import { ColorPickerProps } from "antd/es/color-picker";
import { createInputEle } from "./utils";
import Tools from "./components/Tools";
import { IDrawTypes } from "@/types";
console.log("version", fabric.version);
console.log("fabric", fabric);
console.log("EraserBrush:", fabric.EraserBrush); // 检查 EraserBrush 是否可用

let zoom = 1;

enum IToolTypes {
  strokeColor,
  fillColor,
  drawType,
  bgColor,
  lineSize,
  fontSize,
  // pencil,
  // line,
  // circle,
  // text,
  // eraser,
  move,
  zoom,
  undo,
  redo,
  picture,
  clear,
  save,
}

type Color = GetProp<ColorPickerProps, "value">;

const strategyMap = {
  [IDrawTypes.select]: (canvas: fabric.Canvas) => {
    console.log("切换到 Select 模式");

    canvas.selection = true;
    canvas.forEachObject((obj) => {
      obj.selectable = true;
    });
  },
  [IDrawTypes.pencil]: (canvas: fabric.Canvas, drawConfig: any) => {
    console.log("切换到 Pencil 模式");
    // 启用画笔模式
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = drawConfig.strokeColor as string;
    canvas.freeDrawingBrush.width = 5;
  },
  [IDrawTypes.line]: (canvas: fabric.Canvas, drawConfig: any) => {
    const line = new fabric.Line([50, 50, 200, 200], {
      stroke: drawConfig.strokeColor, //填充的颜色
      strokeWidth: 5,
    });
    canvas.add(line);
  },
  [IDrawTypes.circle]: (canvas: fabric.Canvas, drawConfig: any) => {
    const circle = new fabric.Circle({
      left: 200, //距离左边的距离
      top: 200, //距离上边的距离
      fill: drawConfig.fillColor, //填充的颜色
      radius: 75,
    });
    canvas.add(circle);
  },
  [IDrawTypes.rect]: (canvas: fabric.Canvas, drawConfig: any) => {
    const rect = new fabric.Rect({
      left: 0, //距离左边的距离
      top: 0, //距离上边的距离
      fill: drawConfig.fillColor, //填充的颜色
      width: 200, //矩形宽度
      height: 200, //矩形高度
    });
    canvas.add(rect);
  },
  [IDrawTypes.triangle]: (canvas: fabric.Canvas, drawConfig: any) => {
    const triangle = new fabric.Triangle({
      left: 200, //距离左边的距离
      top: 200, //距离上边的距离
      fill: drawConfig.fillColor, //填充的颜色
      width: 200, //矩形宽度
      height: 200, //矩形高度
    });
    canvas.add(triangle);
  },
  [IDrawTypes.text]: (canvas: fabric.Canvas) => {},
  [IDrawTypes.image]: (canvas: fabric.Canvas) => {},
  [IDrawTypes.eraser]: (canvas: fabric.Canvas) => {
    canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
    canvas.isDrawingMode = true;
    // 设置橡皮擦大小
    canvas.freeDrawingBrush.width = 4;
  },
};

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const [active, setActive] = useState<IDrawTypes>(IDrawTypes.pencil);
  const [drawConfig, setDrawConfig] = useState({
    strokeColor: "#dadada" as Color,
    fillColor: "#c66e7e" as Color,
  });

  const dispatch = (
    key: keyof typeof drawConfig,
    value: (typeof drawConfig)[keyof typeof drawConfig]
  ) => {
    setDrawConfig({
      ...drawConfig,
      [key]: value,
    });
  };

  const initCanvasModeReset = () => {
    canvasInstance.current.contextTop.globalCompositeOperation = "source-over";
    canvasInstance.current.isDrawingMode = false;
    // 禁用选择模式
    canvasInstance.current.selection = false;
    canvasInstance.current.forEachObject((obj) => {
      obj.selectable = false;
    });
  };

  const onChangeDrawType = (key: IDrawTypes) => {
    if (!canvasInstance.current) {
      console.error("Canvas 未初始化！");
      return;
    }

    setActive(key);
    initCanvasModeReset();

    strategyMap[key](canvasInstance.current, drawConfig);
  };

  const initDraw = () => {
    initCanvasModeReset();
    strategyMap[active](canvasInstance.current, drawConfig);
  };

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current);
    canvasInstance.current.setWidth(window.innerWidth);
    canvasInstance.current.setHeight(window.innerHeight);
    const canvas = canvasInstance.current;
    initDraw();

    canvas.on("mouse:wheel", function (opt) {
      console.log("opt", opt);
      const deltaY = opt.e.deltaY;
      const deltaX = opt.e.deltaX;

      zoom *= 0.999 ** deltaY;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      const vpt = this.viewportTransform;
      console.log("vpt", vpt);
      vpt[0] = zoom; // 在 X 轴方向上的偏移量。
      vpt[3] = zoom; // 在 Y 轴方向上的偏移量。
      vpt[4] += deltaX; // 俩个点的位置差
      vpt[5] += deltaY; // 俩个点的位置差
      this.requestRenderAll();
      this.setViewportTransform(this.viewportTransform);

      // let zoom = canvas.getZoom();
      // zoom *= 0.999 ** delta;
      // if (zoom > 20) zoom = 20;
      // if (zoom < 0.01) zoom = 0.01;
      // canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      canvasInstance.current?.dispose();
      // canvasInstance.current.remove;
      canvasInstance.current = null;
    };
  }, []);

  useEffect(() => {
    canvasInstance.current.on("mouse:dblclick", async function (event) {
      if (event.target) {
        return;
      }

      if (active !== IDrawTypes.text) return;

      const pointer = canvasInstance.current.getPointer(event.e);

      const inputVar = await createInputEle({
        x: event.e.clientX,
        y: event.e.clientY,
        style: {
          color: drawConfig.strokeColor as string,
        },
      });

      const itext = new fabric.IText(inputVar, {
        left: pointer.x,
        top: pointer.y,
        fill: drawConfig.fillColor,
        stroke: drawConfig.strokeColor as string,
        fontSize: 16,
        styles: {
          "font-family":
            "Inter, system-ui, Avenir, Helvetica, Arial, sans-serif",
          "font-weight": "400",
        },
      });

      canvasInstance.current.add(itext);
    });

    return () => {
      canvasInstance.current?.off("mouse:dblclick");
    };
  }, [active, drawConfig]);

  const onUploadImage = useCallback((image: HTMLImageElement) => {
    const fabricImg = new fabric.Image(image, {
      left: 200,
      top: 200,
      scaleX: 0.5,
      scaleY: 0.5,
    });
    canvasInstance.current.add(fabricImg);
  }, []);

  return (
    <>
      <div className={styles["home"]}>
        <div className={styles["tools"]}>
          <Tools
            active={active}
            onChangeDrawType={onChangeDrawType}
            onUploadImage={onUploadImage}
          ></Tools>
        </div>
        <div className={styles["canvas"]}>
          <canvas
            ref={canvasRef}
            id="canvas"
            className={styles["canvas"]}
          ></canvas>
        </div>
      </div>
    </>
  );
}

export default Home;
