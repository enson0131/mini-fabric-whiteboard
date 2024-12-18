import { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import styles from "./index.module.less";

function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const canvasInstance = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current);
    canvasInstance.current.setWidth(window.innerWidth);
    canvasInstance.current.setHeight(window.innerHeight);
    const canvas = canvasInstance.current;

    setTimeout(() => {
      const rect = new fabric.Rect({
        left: 0, //距离左边的距离
        top: 0, //距离上边的距离
        fill: "red", //填充的颜色
        width: 200, //矩形宽度
        height: 200, //矩形高度
      });
      debugger;
      canvasInstance.current.add(rect);
    }, 2000);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="canvas" className={styles["canvas"]}></canvas>
    </>
  );
}

export default Home;
