import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import styles from "./index.module.less";

import { ColorPicker, GetProp, Radio, RadioChangeEvent } from "antd";
import { ColorPickerProps } from "antd/es/color-picker";

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
    strokeColor: "red" as Color,
    fillColor: "#ffffff" as Color,
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
        canvasInstance.current.freeDrawingBrush.color =
          drawConfig.strokeColor as string;
        canvasInstance.current.freeDrawingBrush.width = 5;
        break;
      case IDrawTypes.line:
        initCanvasModeReset();

        break;
      case IDrawTypes.circle:
        break;
      case IDrawTypes.triangle:
        break;
      case IDrawTypes.text:
        break;
      case IDrawTypes.eraser:
        // TODO enson 有问题
        initCanvasModeReset();

        canvasInstance.current.isDrawingMode = true;

        // 设置橡皮擦大小
        canvasInstance.current.freeDrawingBrush.width = 4;
        canvasInstance.current.freeDrawingBrush.color =
          "rgba(255, 255, 255, 1)"; // 模拟透明效果

        // 监听绘制结束事件，移除路径下的对象
        canvasInstance.current.on("path:created", (event) => {
          const path = event.path;
          canvasInstance.current.remove(path); // 绘制完后隐藏路径

          canvasInstance.current.forEachObject((obj) => {
            if (obj.intersectsWithObject(path)) {
              canvasInstance.current.remove(obj); // 如果路径和对象相交，删除对象
            }
          });
        });
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
              <Radio.Button value={IDrawTypes.circle}>Circle</Radio.Button>
              <Radio.Button value={IDrawTypes.triangle}>Triangle</Radio.Button>
              <Radio.Button value={IDrawTypes.text}>Text</Radio.Button>
              <Radio.Button value={IDrawTypes.eraser}>Eraser</Radio.Button>
              <Radio.Button value={IDrawTypes.text}>Text</Radio.Button>
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
      canvasInstance.current = null;
    };
  }, []);

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
