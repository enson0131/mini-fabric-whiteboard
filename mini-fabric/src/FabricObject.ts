import { Util } from "./Util";

export class FabricObject {
  public type: string; // 对象类型
  public visible: boolean; // 是否可见
  public active: boolean; // 是否激活, 选中状态
  public top: number; // 对象左上角 y 坐标
  public left: number; // 对象左上角 x 坐标

  public width: number; // 对象宽度
  public height: number; // 对象高度
  public scaleX: number; // X轴 缩放比例
  public scaleY: number; // Y轴 缩放比例
  public angle: number; // 旋转角度

  public rotatingPointOffset: number = 40; // 旋转控制点到边框的距离

  constructor(options) {
    this.initialize(options);
  }

  initialize(options) {
    // this.setOptions(options);
  }

  /**
   * 抽象逻辑: 在canvas中先通过坐标转化达到物体的 平移/渲染/缩放/旋转 等效果, 再绘制物体, 这样做的目的是为了尽量不去改变物体的宽高和大小，而是通过各种变换来达到所需要的效果
   * 绘制物体的通用方法
   * @param ctx
   */
  render(ctx: CanvasRenderingContext2D) {
    // 看不见的物体不绘制
    if (this.width === 0 || this.height === 0 || !this.visible) return;
    // 凡是要变换坐标系或者设置画笔属性都需要用先用 save 保存和再用 restore 还原，避免影响到其他东西的绘制
    ctx.save();
    // 1、坐标变换
    this.transform(ctx);
    // 2、绘制物体
    //
    this._render(ctx);

    // 如果是选中态
    if (this.active) {
      // 绘制物体边框
      this.drawBorders(ctx);
      // 绘制物体四周的控制点，共⑨个
      this.drawControls(ctx);
    }
    ctx.restore();
  }

  transform(ctx: CanvasRenderingContext2D) {
    // 1、平移
    ctx.translate(this.left, this.top);

    // 2、旋转
    ctx.rotate(Util.degreesToRadians(this.angle)); // rotate 方法的参数是弧度

    // 3、缩放
    ctx.scale(this.scaleX, this.scaleY);
  }

  /** 具体由子类来实现，因为这确实是每个子类物体所独有的 */
  _render(ctx: CanvasRenderingContext2D) {}

  /**
   * 绘制激活物体边框
   * @param ctx
   */
  drawBorders(ctx: CanvasRenderingContext2D) {
    const padding = 2; // 边框和物体的内边距
    const padding2 = padding * 2; // 边框和物体的内边距的两倍
    const strokeWidth = 1; // 边框宽度

    ctx.save();

    ctx.globalAlpha = 1; //this.isMoving ? 0.5 : 1;

    ctx.strokeStyle = "rgba(102,153,255,0.75)";
    ctx.lineWidth = strokeWidth;

    // 画边框的时候需要把 transform 变换中的 scale 效果抵消，这样才能画出原始大小的线条
    ctx.scale(1 / this.scaleX, 1 / this.scaleY);

    // 获取元素的大小
    const w = this.getWidth();
    const h = this.getHeight();

    /**
     * 默认的坐标系是以对象的中心点为参考的，而非左上角。这种设计有助于在旋转和缩放时保持计算简单且一致。
     */
    ctx.strokeRect(
      -(w / 2) - padding - strokeWidth / 2,
      -(h / 2) - padding - strokeWidth / 2,
      w + padding2 + strokeWidth,
      h + padding2 + strokeWidth
    );

    // 绘制旋转控制点 + 点和边框连接的那条线
    const rotateHeight = (-h - strokeWidth - padding2) / 2;
    ctx.beginPath();
    ctx.moveTo(0, rotateHeight);
    ctx.lineTo(0, -rotateHeight - this.rotatingPointOffset);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
    return this;
  }

  /**
   * 绘制物体四周的控制点，共⑨个
   * @param ctx
   */
  drawControls(ctx: CanvasRenderingContext2D): FabricObject {
    return this;
  }

  /** 获取当前大小，包含缩放效果 */
  getWidth(): number {
    return this.width * this.scaleX;
  }
  /** 获取当前大小，包含缩放效果 */
  getHeight(): number {
    return this.height * this.scaleY;
  }
}
