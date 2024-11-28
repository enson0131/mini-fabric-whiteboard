import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import styles from "./index.module.less";
import "@/lib/eraser_brush.mixin.js";
import { ColorPicker, GetProp, Radio, RadioChangeEvent } from "antd";
import { ColorPickerProps } from "antd/es/color-picker";
import { createInputEle } from "./utils";

console.log(fabric.version);
console.log("EraserBrush:", fabric.EraserBrush); // 检查 EraserBrush 是否可用

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

enum IDrawTypes {
  select,
  pencil,
  line,
  circle,
  rect,
  triangle,
  text,
  eraser,
}

interface ITools {
  key: IToolTypes;
  render: () => JSX.Element;
}

type Color = GetProp<ColorPickerProps, "value">;

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const canvasInstance = useRef<fabric.Canvas | null>(null);
  const [active, setActive] = useState<IDrawTypes>(IDrawTypes.select);
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

  const onChangeDrawType = (e: RadioChangeEvent) => {
    if (!canvasInstance.current) {
      console.error("Canvas 未初始化！");
      return;
    }

    setActive(e.target.value);

    switch (e.target.value) {
      case IDrawTypes.select:
        console.log("切换到 Select 模式");
        initCanvasModeReset();
        canvasInstance.current.selection = true;
        canvasInstance.current.forEachObject((obj) => {
          obj.selectable = true;
        });
        break;
      case IDrawTypes.pencil:
        console.log("切换到 Pencil 模式");

        initCanvasModeReset();

        // 启用画笔模式
        canvasInstance.current.isDrawingMode = true;
        canvasInstance.current.freeDrawingBrush = new fabric.PencilBrush(
          canvasInstance.current
        );
        canvasInstance.current.freeDrawingBrush.color =
          drawConfig.strokeColor as string;
        canvasInstance.current.freeDrawingBrush.width = 5;
        break;
      case IDrawTypes.line:
        initCanvasModeReset();
        const line = new fabric.Line([50, 50, 200, 200], {
          stroke: drawConfig.strokeColor, //填充的颜色
          strokeWidth: 5,
        });
        canvasInstance.current.add(line);
        break;
      case IDrawTypes.circle:
        const circle = new fabric.Circle({
          left: 200, //距离左边的距离
          top: 200, //距离上边的距离
          fill: drawConfig.fillColor, //填充的颜色
          radius: 75,
        });
        canvasInstance.current.add(circle);
        break;
      case IDrawTypes.rect:
        initCanvasModeReset();
        const rect = new fabric.Rect({
          left: 200, //距离左边的距离
          top: 200, //距离上边的距离
          fill: drawConfig.fillColor, //填充的颜色
          width: 200, //矩形宽度
          height: 200, //矩形高度
        });
        canvasInstance.current.add(rect);
        break;
      case IDrawTypes.triangle:
        initCanvasModeReset();
        const triangle = new fabric.Triangle({
          left: 200, //距离左边的距离
          top: 200, //距离上边的距离
          fill: drawConfig.fillColor, //填充的颜色
          width: 200, //矩形宽度
          height: 200, //矩形高度
        });
        canvasInstance.current.add(triangle);
        break;
      case IDrawTypes.text:
        initCanvasModeReset();
        break;
      case IDrawTypes.eraser:
        initCanvasModeReset();
        canvasInstance.current.freeDrawingBrush = new fabric.EraserBrush(
          canvasInstance.current
        );
        // console.log(
        //   `canvasInstance.current.freeDrawingBrush.contextTop,,`,
        //   canvasInstance.current.freeDrawingBrush
        // );
        // canvasInstance.current.freeDrawingBrush.canvas.contextTop.globalCompositeOperation =
        //   "destination-out";

        // canvasInstance.current.freeDrawingBrush.canvas.contextContainer.globalCompositeOperation =
        //   "destination-out";
        canvasInstance.current.isDrawingMode = true;
        // 设置橡皮擦大小
        canvasInstance.current.freeDrawingBrush.width = 4;

        break;
    }
  };

  const tools: Array<ITools> = [
    {
      key: IToolTypes.strokeColor,
      render: () => {
        return (
          <div className={styles["tools-item-config"]}>
            <ColorPicker
              value={drawConfig.strokeColor}
              onChange={(value) => dispatch("strokeColor", value)}
            />
            <div className={styles["tools-item-text"]}>strokeColor</div>
          </div>
        );
      },
    },
    {
      key: IToolTypes.fillColor,
      render: () => {
        return (
          <div className={styles["tools-item-config"]}>
            <ColorPicker
              value={drawConfig.fillColor}
              onChange={(value) => dispatch("fillColor", value)}
            />
            <div className={styles["tools-item-text"]}>fillColor</div>
          </div>
        );
      },
    },
    {
      key: IToolTypes.drawType,
      render: () => {
        return (
          <div className={styles["tools-item-config"]}>
            <Radio.Group onChange={onChangeDrawType} value={active}>
              <Radio.Button value={IDrawTypes.select}>Select</Radio.Button>
              <Radio.Button value={IDrawTypes.pencil}>Pencil</Radio.Button>
              <Radio.Button value={IDrawTypes.line}>Line</Radio.Button>
              <Radio.Button value={IDrawTypes.rect}>Rect</Radio.Button>
              <Radio.Button value={IDrawTypes.circle}>Circle</Radio.Button>
              <Radio.Button value={IDrawTypes.triangle}>Triangle</Radio.Button>
              <Radio.Button value={IDrawTypes.text}>Text</Radio.Button>
              <Radio.Button value={IDrawTypes.eraser}>Eraser</Radio.Button>
            </Radio.Group>
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current);
    canvasInstance.current.setWidth(window.innerWidth);
    canvasInstance.current.setHeight(window.innerHeight);

    return () => {
      canvasInstance.current?.dispose();
      // canvasInstance.current.remove;
      canvasInstance.current = null;
    };
  }, []);

  // useEffect

  useEffect(() => {
    // var itext = new fabric.IText('This is a IText object', {
    //   left: 100,
    //   top: 300,
    //   fill: '#D81B60',
    //   strokeWidth: 2,
    //   stroke: "#880E4F",
    // });
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

  return (
    <>
      <div className={styles["home"]}>
        <div className={styles["tools"]}>
          {tools.map((tool) => {
            return (
              <div className={styles["tools-item"]} key={tool.key}>
                {tool.render()}
              </div>
            );
          })}
        </div>
        {/* <div key={1} className={styles["canvas"]}> */}
        <canvas
          ref={canvasRef}
          id="canvas"
          className={styles["canvas"]}
        ></canvas>
        {/* </div> */}
      </div>
    </>
  );
}

export default Home;
