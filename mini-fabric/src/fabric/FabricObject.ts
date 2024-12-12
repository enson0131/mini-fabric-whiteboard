import { Point } from "./Point";
import { Util } from "./Util";
const originXOffset = {
  left: -0.5,
  center: 0,
  right: 0.5,
};
const originYOffset = {
  top: -0.5,
  center: 0,
  bottom: 0.5,
};
export class FabricObject {
  public type: string; // 对象类型
  public visible: boolean = true; // 是否可见

  /** 默认水平变换中心 left | right | center, 对象转换的水平原点*/
  public originX: string = "left";
  /** 默认垂直变换中心 top | bottom | center, 对象转换的垂直原点*/
  public originY: string = "top";

  public active: boolean; // 是否激活, 选中状态
  public top: number; // 对象左上角 y 坐标
  public left: number; // 对象左上角 x 坐标

  public width: number; // 对象宽度
  public height: number; // 对象高度
  public scaleX: number = 1; // X轴 缩放比例
  public scaleY: number = 1; // Y轴 缩放比例
  public angle: number; // 旋转角度

  /** 物体默认描边颜色，默认无 */
  public stroke: string;
  /** 物体默认描边宽度 */
  public strokeWidth: number = 1;
  /** 矩阵变换 */
  // public transformMatrix: number[];
  /** 最小缩放值 */
  // public minScaleLimit: number = 0.01;
  /** 是否有控制点 */
  public hasControls: boolean = true;
  /** 是否有旋转控制点 */
  public hasRotatingPoint: boolean = true;
  /** 旋转控制点偏移量 */
  public rotatingPointOffset: number = 40;
  /** 移动的时候边框透明度 */
  public borderOpacityWhenMoving: number = 0.4;
  /** 物体是否在移动中 */
  public isMoving: boolean = false;
  /** 选中态的边框宽度 */
  public borderWidth: number = 1;
  /** 物体控制点用 stroke 还是 fill */
  public transparentCorners: boolean = false;
  /** 物体控制点大小，单位 px */
  public cornerSize: number = 12;
  /** 通过像素来检测物体而不是通过包围盒 */
  public perPixelTargetFind: boolean = false;

  /** 激活态边框颜色 */
  public borderColor: string = "red";
  /** 激活态控制点颜色 */
  public cornerColor: string = "red";
  /** 物体默认填充颜色 */
  public fill: string = "rgb(0,0,0)";

  /** 左右镜像，比如反向拉伸控制点 */
  public flipX: boolean = false;
  /** 上下镜像，比如反向拉伸控制点 */
  public flipY: boolean = false;

  /**
   * When `false`, the stoke width will scale with the object.
   * When `true`, the stroke will always match the exact pixel size entered for stroke width.
   * this Property does not work on Text classes or drawing call that uses strokeText,fillText methods
   * default to false
   * @since 2.6.0
   * @type Boolean
   * @default false
   * @type Boolean
   * @default false
   */
  public strokeUniform: boolean = false;

  /**
   * Angle of skew on x axes of an object (in degrees)
   * @type Number
   * @default
   */
  public skewX = 0;

  /**
   * Angle of skew on y axes of an object (in degrees)
   * @type Number
   * @default
   */
  public skewY = 0;

  // 公共属性
  public stateProperties: string[] =
    `top,left,width,height,scaleX,scaleY,flipX,flipY,angle,cornerSize,fill,originX,originY,stroke,strokeWidth,borderWidth,transformMatrix,visible`.split(
      ","
    );

  constructor(options) {
    this.initialize(options);
  }

  initialize(options) {
    this.setOptions(options);
  }

  setOptions(options) {
    for (const key in options) {
      this[key] = options[key];
    }
  }

  /**
   * 抽象逻辑: 在canvas中先通过坐标转化达到物体的 平移/渲染/缩放/旋转 等效果, 再绘制物体, 这样做的目的是为了尽量不去改变物体的宽高和大小，而是通过各种变换来达到所需要的效果
   * 绘制物体的通用方法
   * @param ctx
   */
  render(ctx: CanvasRenderingContext2D) {
    console.log("render", this.width, this.height, this.visible);
    // 看不见的物体不绘制
    if (this.width === 0 || this.height === 0 || !this.visible) return;
    // 凡是要变换坐标系或者设置画笔属性都需要用先用 save 保存和再用 restore 还原，避免影响到其他东西的绘制
    ctx.save();

    // 1、坐标变换
    this.transform(ctx);

    if (this.stroke) {
      ctx.lineWidth = this.strokeWidth;
      ctx.strokeStyle = this.stroke;
    }

    if (this.fill) {
      ctx.fillStyle = this.fill;
    }

    // 2、绘制物体
    this._render(ctx);

    // 如果是选中态
    if (this.active) {
      // 绘制物体边框
      this.drawBorders(ctx);
      // 绘制物体四周的控制点，共⑨个
      this.drawControls(ctx);
    }

    // 画自身坐标系
    this.drawAxis(ctx);

    ctx.restore();
  }

  /**
   * 坐标变换
   * 平移 -> 旋转 -> 缩放
   * @param ctx
   */
  transform(ctx: CanvasRenderingContext2D) {
    const center = this.getCenterPoint(); // 获取中心点 TODO 这里的获取方式有问题

    console.log("center", center);
    // 1、平移
    ctx.translate(center.x, center.y); // 先平移到中心点

    // // 2、旋转
    ctx.rotate(Util.degreesToRadians(this.angle)); // rotate 方法的参数是弧度

    // // 3、缩放
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

  get(key: string) {
    return this[key];
  }

  /**
   * 转成基础标准对象，方便序列化
   * @param propertiesToInclude 你可能需要添加一些额外的自定义属性
   * @returns 标准对象
   */
  toObject(propertiesToInclude = []) {
    // 保存时的数字精度
    const NUM_FRACTION_DIGITS = 2;

    const object = {
      type: this.type,
      originX: this.originX,
      originY: this.originY,
      left: Util.toFixed(this.left, NUM_FRACTION_DIGITS),
      top: Util.toFixed(this.top, NUM_FRACTION_DIGITS),
      width: Util.toFixed(this.width, NUM_FRACTION_DIGITS),
      height: Util.toFixed(this.height, NUM_FRACTION_DIGITS),
      fill: this.fill,
      stroke: this.stroke,
      strokeWidth: this.strokeWidth,
      scaleX: Util.toFixed(this.scaleX, NUM_FRACTION_DIGITS),
      scaleY: Util.toFixed(this.scaleY, NUM_FRACTION_DIGITS),
      angle: Util.toFixed(this.angle, NUM_FRACTION_DIGITS),
      flipX: this.flipX,
      flipY: this.flipY,
      visible: this.visible,
      hasControls: this.hasControls,
      hasRotatingPoint: this.hasRotatingPoint,
      transparentCorners: this.transparentCorners,
      perPixelTargetFind: this.perPixelTargetFind,
    };

    Util.populateWithProperties(this, object, propertiesToInclude);
    return object;
  }

  // TODO 这个不理解
  drawAxis(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const lengthRatio = 1.5;
    const w = this.getWidth();
    const h = this.getHeight();
    ctx.lineWidth = this.borderWidth;
    ctx.setLineDash([4 * lengthRatio, 3 * lengthRatio]);
    /** 画坐标轴的时候需要把 transform 变换中的 scale 效果抵消，这样才能画出原始大小的线条 */
    ctx.scale(1 / this.scaleX, 1 / this.scaleY);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo((w / 2) * lengthRatio, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, (h / 2) * lengthRatio);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 获取元素的中心点
   */
  getCenterPoint() {
    return this.translateToCenterPoint(
      new Point(this.left, this.top), // 因为元素的render方法都是默认以中心点为参考的（向左上偏移一半），所以这里的中心点就是元素的左上角坐标
      this.originX,
      this.originY
    );
  }

  /** 将中心点移到变换基点 */
  translateToCenterPoint(
    point: Point,
    originX: string,
    originY: string
  ): Point {
    const p = this.translateToGivenOrigin(
      point,
      originX,
      originY,
      "center",
      "center"
    );
    if (this.angle) {
      return Util.rotatePoint(p, point, Util.degreesToRadians(this.angle)); // 考虑旋转的场景
    } else {
      return p;
    }
  }

  translateToGivenOrigin(
    point: Point,
    fromOriginX: string | number,
    fromOriginY: string | number,
    toOriginX: string | number,
    toOriginY: string | number
  ): Point {
    let x = point.x,
      y = point.y,
      dim;
    if (typeof fromOriginX === "string") {
      fromOriginX = originXOffset[fromOriginX];
    } else {
      fromOriginX -= 0.5;
    }

    if (typeof toOriginX === "string") {
      toOriginX = originXOffset[toOriginX];
    } else {
      toOriginX -= 0.5;
    }

    const offsetX = Number(toOriginX) - Number(fromOriginX);

    if (typeof fromOriginY === "string") {
      fromOriginY = originYOffset[fromOriginY];
    } else {
      fromOriginY -= 0.5;
    }
    if (typeof toOriginY === "string") {
      toOriginY = originYOffset[toOriginY];
    } else {
      toOriginY -= 0.5;
    }

    debugger;
    const offsetY = Number(toOriginY) - Number(fromOriginY);
    if (offsetX || offsetY) {
      dim = this._getTransformedDimensions();
      x = point.x + offsetX * dim.x;
      y = point.y + offsetY * dim.y;
    }
    return new Point(x, y);
  }

  /*
   * Calculate object bounding box dimensions from its properties scale, skew.
   * @param {Number} skewX, a value to override current skewX
   * @param {Number} skewY, a value to override current skewY
   * @private
   * @return {Object} .x width dimension
   * @return {Object} .y height dimension
   */
  _getTransformedDimensions(
    paramsSkewX?: number,
    paramsSkewY?: number
  ): { x: number; y: number } {
    const skewX = paramsSkewX ?? this.skewX;
    const skewY = paramsSkewY ?? this.skewY;

    let dimensions;
    let dimX;
    let dimY;

    const noSkew = skewX === 0 && skewY === 0;

    if (this.strokeUniform) {
      dimX = this.width;
      dimY = this.height;
    } else {
      dimensions = this._getNonTransformedDimensions();
      dimX = dimensions.x;
      dimY = dimensions.y;
    }

    if (noSkew) {
      return this._finalizeDimensions(dimX * this.scaleX, dimY * this.scaleY);
    }

    const bbox = Util.sizeAfterTransform(dimX, dimY, {
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      skewX,
      skewY,
    });

    return this._finalizeDimensions(bbox.x, bbox.y);
  }

  /*
   * Calculate object bounding box dimensions from its properties scale, skew.
   * @param Number width width of the bbox
   * @param Number height height of the bbox
   * @private
   * @return {Object} .x finalized width dimension
   * @return {Object} .y finalized height dimension
   */
  _finalizeDimensions(width, height) {
    return this.strokeUniform
      ? { x: width + this.strokeWidth, y: height + this.strokeWidth }
      : { x: width, y: height };
  }

  /*
   * Calculate object dimensions from its properties
   * @private
   * @return {Object} .x width dimension
   * @return {Object} .y height dimension
   */
  _getNonTransformedDimensions() {
    const strokeWidth = this.strokeWidth,
      w = this.width + strokeWidth,
      h = this.height + strokeWidth;
    return { x: w, y: h };
  }
}
