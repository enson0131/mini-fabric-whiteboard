import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import styles from "./app.module.less";
import { fabric } from "./fabric/index";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const canvasInstance = useRef<null>(null);

  useEffect(() => {
    canvasInstance.current = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const rect = new fabric.Rect({
      left: 0,
      top: 0,
      fill: "red",
      width: 200,
      height: 200,
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
