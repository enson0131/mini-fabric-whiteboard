import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import styles from "./app.module.less";
import { fabric } from "./fabric/index";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const canvasInstance = useRef<null>(null);

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current, {});
    // canvasInstance.current.setWidth(window.innerWidth);
    // canvasInstance.current.setHeight(window.innerHeight);

    const rect = new fabric.Rect({
      width: 200,
      height: 100,
      fill: "red",
      left: 100,
      top: 100,
    });

    canvasInstance.current.add(rect);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} id="canvas" className={styles["canvas"]}></canvas>
    </>
  );
}

export default App;
