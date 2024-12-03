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
}
