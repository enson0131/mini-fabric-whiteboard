import { kRect } from "../contants";
import { FabricObject } from "../FabricObject";

/**
 * 矩形对象
 */
export class Rect extends FabricObject {
  public type: string = "rect"; // 矩形标识
  /** 圆角 rx */
  public rx: number = 0;
  /** 圆角 ry */
  public ry: number = 0;

  constructor(options) {
    super(options);
    this._initStateProperties();
    this._initRxRy(options);
  }

  _initStateProperties() {
    this.stateProperties = this.stateProperties.concat(["rx", "ry"]);
  }

  _initRxRy(options) {
    this.rx = options.rx || 0;
    this.ry = options.ry || 0;
  }

  /**
   * 单纯绘制矩形
   */
  _render(ctx: CanvasRenderingContext2D) {
    const { width: w, height: h } = this;
    const x = -w / 2; // 默认的坐标系是以对象的中心点为参考的，而非左上角。这种设计有助于在旋转和缩放时保持计算简单且一致。
    const y = -h / 2;
    const rx = this.rx ? Math.min(this.rx, w / 2) : 0;
    const ry = this.ry ? Math.min(this.ry, h / 2) : 0;
    const isRounded = rx !== 0 || ry !== 0;
    // 绘制一个矩形
    ctx.save();
    ctx.beginPath();

    // 从左上角开始顺时针绘制
    ctx.moveTo(x + rx, y);
    ctx.lineTo(x + w - rx, y);

    if (isRounded) {
      // 该方法需要三个点：前两个点是控制点，第三个点是结束点
      ctx.bezierCurveTo(
        x + w - kRect * rx, // 控制点
        y,
        x + w, // 控制点
        y + kRect * ry,
        x + w, // 终点
        y + ry
      );
    }

    ctx.lineTo(x + w, y + h - ry);

    if (isRounded) {
      // 该方法需要三个点：前两个点是控制点，第三个点是结束点
      ctx.bezierCurveTo(
        x + w,
        y + h - kRect * ry,
        x + w - kRect * rx,
        y + h,
        x + w - rx,
        y + h
      );
    }

    ctx.lineTo(x + rx, y + h);

    isRounded &&
      ctx.bezierCurveTo(
        x + kRect * rx,
        y + h,
        x,
        y + h - kRect * ry,
        x,
        y + h - ry
      );

    ctx.lineTo(x, y + ry);

    isRounded &&
      ctx.bezierCurveTo(x, y + kRect * ry, x + kRect * rx, y, x + rx, y);

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  toObject(propertiesToInclude) {
    return Object.assign(super.toObject(propertiesToInclude), {
      rx: this.get("rx") || 0,
      ry: this.get("ry") || 0,
    });
  }
}
