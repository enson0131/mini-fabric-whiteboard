import { Coords, Corner } from "./interface";
import { Point } from "./Point";
import { Util } from "./Util";

/**
 引入 原点偏移量 的原因，是为了灵活处理在对象的【局部坐标系统】中，不同参考点（原点）对齐方式的转换。这是因为对象的原点可以根据需求设定为左上角、中心点、右下角等，而这些不同的对齐方式会直接影响到坐标的计算。

  1 灵活定义对齐点：

  在图形和动画处理中，对象的原点决定了如何定位和变换它。例如：
  如果原点是左上角（left-top），则坐标 (0, 0) 对应对象的左上角。
  如果原点是中心点（center-center），同样的坐标 (0, 0) 就表示对象的中心。
    ** 通过使用偏移量，可以从一个参考原点轻松切换到另一个，而无需重新计算整个对象的全局坐标。 **

  2 简化数学计算：

  使用偏移量可以统一表示不同的对齐方式。例如：

  left 对应 -0.5，center 对应 0，right 对应 0.5。
  通过偏移量的差值，可以直接计算从一个原点到另一个原点的位移，避免了手动推导复杂的数学关系
 */
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

  public active: boolean = true; // 是否激活, 选中状态
  public top: number; // 对象左上角 y 坐标
  public left: number; // 对象左上角 x 坐标

  public width: number; // 对象宽度
  public height: number; // 对象高度
  public scaleX: number = 1; // X轴 缩放比例
  public scaleY: number = 1; // Y轴 缩放比例
  public angle: number = 0; // 旋转角度

  /** 物体默认描边颜色，默认无 */
  public stroke: string;
  /** 物体默认描边宽度 */
  public strokeWidth: number = 1;

  /** 物体缩放后的宽度 */
  public currentWidth: number = 0;
  /** 物体缩放后的高度 */
  public currentHeight: number = 0;

  /** 选中态物体和边框之间的距离 */
  public padding: number = 0;
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

  /** 物体执行变换之前的状态 */
  public originalState;

  /** 物体所在的 canvas 画布 */
  public canvas;

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

  /** 物体控制点位置，随时变化 */
  public oCoords: Coords;

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

  setupState() {
    this.originalState = {};
    this.saveState();
  }
  /** 保存物体当前的状态到 originalState 中 */
  saveState(): FabricObject {
    this.stateProperties.forEach((prop) => {
      this.originalState[prop] = this[prop];
    });
    return this;
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
    if (this.hasRotatingPoint && this.hasControls) {
      let rotateHeight = (-h - strokeWidth - padding * 2) / 2;
      ctx.beginPath();
      ctx.moveTo(0, rotateHeight);
      ctx.lineTo(0, rotateHeight - this.rotatingPointOffset);
      ctx.closePath();
      ctx.stroke();
    }

    ctx.restore();
    return this;
  }

  /**
   * 绘制物体四周的控制点，共⑨个
   * @param ctx
   */
  /** 绘制包围盒模型的控制点 */
  drawControls(ctx: CanvasRenderingContext2D): FabricObject {
    if (!this.hasControls) return;
    // 因为画布已经经过变换，所以大部分数值需要除以 scale 来抵消变换
    let size = this.cornerSize,
      size2 = size / 2,
      strokeWidth2 = this.strokeWidth / 2,
      // top 和 left 值为物体左上角的点
      left = -(this.width / 2),
      top = -(this.height / 2),
      _left,
      _top,
      sizeX = size / this.scaleX,
      sizeY = size / this.scaleY,
      paddingX = this.padding / this.scaleX,
      paddingY = this.padding / this.scaleY,
      scaleOffsetY = size2 / this.scaleY,
      scaleOffsetX = size2 / this.scaleX,
      scaleOffsetSizeX = (size2 - size) / this.scaleX,
      scaleOffsetSizeY = (size2 - size) / this.scaleY,
      height = this.height,
      width = this.width,
      // 控制点是实心还是空心
      methodName = this.transparentCorners ? "strokeRect" : "fillRect";

    ctx.save();

    ctx.lineWidth = this.borderWidth / Math.max(this.scaleX, this.scaleY);

    ctx.globalAlpha = this.isMoving ? this.borderOpacityWhenMoving : 1;
    ctx.strokeStyle = ctx.fillStyle = this.cornerColor;

    // top-left
    _left = left - scaleOffsetX - strokeWidth2 - paddingX;
    _top = top - scaleOffsetY - strokeWidth2 - paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // top-right
    _left = left + width - scaleOffsetX + strokeWidth2 + paddingX;
    _top = top - scaleOffsetY - strokeWidth2 - paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // bottom-left
    _left = left - scaleOffsetX - strokeWidth2 - paddingX;
    _top = top + height + scaleOffsetSizeY + strokeWidth2 + paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // bottom-right
    _left = left + width + scaleOffsetSizeX + strokeWidth2 + paddingX;
    _top = top + height + scaleOffsetSizeY + strokeWidth2 + paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // middle-top
    _left = left + width / 2 - scaleOffsetX;
    _top = top - scaleOffsetY - strokeWidth2 - paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // middle-bottom
    _left = left + width / 2 - scaleOffsetX;
    _top = top + height + scaleOffsetSizeY + strokeWidth2 + paddingY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // middle-right
    _left = left + width + scaleOffsetSizeX + strokeWidth2 + paddingX;
    _top = top + height / 2 - scaleOffsetY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // middle-left
    _left = left - scaleOffsetX - strokeWidth2 - paddingX;
    _top = top + height / 2 - scaleOffsetY;
    ctx.clearRect(_left, _top, sizeX, sizeY);
    ctx[methodName](_left, _top, sizeX, sizeY);

    // 绘制旋转控制点
    if (this.hasRotatingPoint) {
      _left = left + width / 2 - scaleOffsetX;
      _top =
        top -
        this.rotatingPointOffset / this.scaleY -
        sizeY / 2 -
        strokeWidth2 -
        paddingY;

      ctx.clearRect(_left, _top, sizeX, sizeY);
      ctx[methodName](_left, _top, sizeX, sizeY);
    }

    ctx.restore();

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

  /**
   * 绘制元素坐标轴
   * @param ctx
   */
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
    // 当下也可以简单的是直接返回 new Point(this.width / 2, this.height / 2)
    return this.translateToCenterPoint(
      new Point(this.left, this.top), // 因为元素的 render 方法都是默认以中心点为参考的（向左上偏移一半），所以这里的中心点就是通过元素的左上角坐标计算出来的
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

  /**
   * 将点从一个 fromOrigin 参考点转移到 toOrigin 参考点
   * @param point 点
   * @param fromOriginX 原点
   * @param fromOriginY 原点
   * @param toOriginX 原点
   * @param toOriginY 原点
   * @returns 平移后的点
   */
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

    // 对元素局部坐标进行转化
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

    const offsetY = Number(toOriginY) - Number(fromOriginY);
    if (offsetX || offsetY) {
      dim = this._getTransformedDimensions(); // 获取到元素的宽高
      x = point.x + offsetX * dim.x;
      y = point.y + offsetY * dim.y;
    }
    return new Point(x, y); // 获取到中心点坐标
  }

  /**
   * 获取到元素的宽高
   * @param paramsSkewX 斜切角度
   * @param paramsSkewY 斜切角度
   * @returns 元素的宽高
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

  /** 获取包围盒的四条边 */
  _getImageLines(corner: Corner) {
    return {
      topline: {
        o: corner.tl,
        d: corner.tr,
      },
      rightline: {
        o: corner.tr,
        d: corner.br,
      },
      bottomline: {
        o: corner.br,
        d: corner.bl,
      },
      leftline: {
        o: corner.bl,
        d: corner.tl,
      },
    };
  }
  /**
   * 射线检测法：以鼠标坐标点为参照，水平向右做一条射线，求坐标点与多条边的交点个数
   * 如果和物体相交的个数为偶数点则点在物体外部；如果为奇数点则点在内部
   * 不过 fabric 的点选多边形都是用于包围盒，也就是矩形，所以该方法是专门针对矩形的，并且针对矩形做了一些优化
   */
  _findCrossPoints(ex: number, ey: number, lines): number {
    let b1, // 射线的斜率
      b2, // 边的斜率
      a1, // 射线的截距 也就是 y = b1 * x + a1 （这里的 a1）
      a2, // 边的截距
      xi, // 射线与边的交点
      // yi, // 射线与边的交点
      xcount = 0,
      iLine; // 当前边

    console.log(`lines--->`, lines);

    // 遍历包围盒的四条边
    for (let lineKey in lines) {
      iLine = lines[lineKey];

      // 优化1: 如果射线在直线的上方，则直接返回
      if (iLine.o.y < ey && iLine.d.y < ey) {
        continue;
      }

      // 优化2: 如果射线在直线的下方，则直接返回
      if (iLine.o.y > ey && iLine.d.y > ey) {
        continue;
      }

      // 优化3: 如果直线是垂直的，则直接返回
      if (iLine.o.x === iLine.d.x && iLine.o.x >= ex) {
        xi = iLine.o.x;
      } else {
        /*
        数学原理:
          射线方程：y = b1x + a1
          边界线段方程：y = b2x + a2
          交点处：b1x + a1 = b2x + a2
          求解x坐标：x = -(a1 - a2)/(b1 - b2)
        */
        // 简单计算下射线与边的交点，看式子容易晕，建议自己手动算一下
        b1 = 0;
        b2 = (iLine.d.y - iLine.o.y) / (iLine.d.x - iLine.o.x);
        a1 = ey - b1 * ex;
        a2 = iLine.o.y - b2 * iLine.o.x;
        xi = -(a1 - a2) / (b1 - b2); // 求俩个直接的交点，即求出交点的 x 坐标 即 xi = a1 - a2 / b2;
      }

      // 只需要计数 xi >= ex 的情况
      if (xi >= ex) {
        xcount += 1;
      }
      // 优化4：因为 fabric 中的多边形只需要用到矩形，所以根据矩形的特质，顶多只有两个交点，所以我们可以提前结束循环
      if (xcount === 2) {
        break;
      }
    }
    return xcount;
  }

  /** 重新设置物体包围盒的边框和各个控制点，包括位置和大小 */
  setCoords(): FabricObject {
    let strokeWidth = this.strokeWidth > 1 ? this.strokeWidth : 0,
      padding = this.padding,
      radian = Util.degreesToRadians(this.angle);

    this.currentWidth = (this.width + strokeWidth) * this.scaleX + padding * 2;
    this.currentHeight =
      (this.height + strokeWidth) * this.scaleY + padding * 2;

    // If width is negative, make postive. Fixes path selection issue
    // if (this.currentWidth < 0) {
    //     this.currentWidth = Math.abs(this.currentWidth);
    // }

    // 物体中心点到顶点的斜边长度
    // Math.sqrt() 函数返回一个数的平方根
    // Math.pow() 函数返回基数（base）的指数（exponent）次幂，即 base^exponent。
    let _hypotenuse = Math.sqrt(
      // 其实就是勾股定理，获取斜边的长度
      Math.pow(this.currentWidth / 2, 2) + Math.pow(this.currentHeight / 2, 2)
    );
    // 获取物体中心点到顶点的斜边与水平线之间的夹角对应的弧度
    let _angle = Math.atan(this.currentHeight / this.currentWidth);
    // let _angle = Math.atan2(this.currentHeight, this.currentWidth);

    // offset added for rotate and scale actions
    let offsetX = Math.cos(_angle + radian) * _hypotenuse,
      offsetY = Math.sin(_angle + radian) * _hypotenuse,
      sinTh = Math.sin(radian), // 旋转角度对应的正弦值
      cosTh = Math.cos(radian); // 旋转角度对应的余弦值

    let coords = this.getCenterPoint();

    console.log(`coords--->`, coords, offsetX, offsetY, this.currentWidth);
    let tl = {
      // 左上角
      x: coords.x - offsetX,
      y: coords.y - offsetY,
    };
    let tr = {
      // 右上角
      x: tl.x + this.currentWidth * cosTh,
      y: tl.y + this.currentWidth * sinTh,
    };
    let br = {
      // 右下角
      x: tr.x - this.currentHeight * sinTh,
      y: tr.y + this.currentHeight * cosTh,
    };
    let bl = {
      x: tl.x - this.currentHeight * sinTh,
      y: tl.y + this.currentHeight * cosTh,
    };
    let ml = {
      // 中左
      x: tl.x - (this.currentHeight / 2) * sinTh,
      y: tl.y + (this.currentHeight / 2) * cosTh,
    };
    let mt = {
      // 中上
      x: tl.x + (this.currentWidth / 2) * cosTh,
      y: tl.y + (this.currentWidth / 2) * sinTh,
    };
    let mr = {
      // 中右
      x: tr.x - (this.currentHeight / 2) * sinTh,
      y: tr.y + (this.currentHeight / 2) * cosTh,
    };
    let mb = {
      // 中下
      x: bl.x + (this.currentWidth / 2) * cosTh,
      y: bl.y + (this.currentWidth / 2) * sinTh,
    };
    let mtr = {
      // 中右上
      x: tl.x + (this.currentWidth / 2) * cosTh,
      y: tl.y + (this.currentWidth / 2) * sinTh,
    };

    // clockwise
    this.oCoords = { tl, tr, br, bl, ml, mt, mr, mb, mtr };

    // 设置控制点
    this._setCornerCoords();

    return this;
  }

  /** 重新设置物体的每个控制点，包括位置和大小 */
  _setCornerCoords() {
    let coords = this.oCoords,
      radian = Util.degreesToRadians(this.angle), // 旋转角度对应的弧度
      newTheta = Util.degreesToRadians(45 - this.angle), // 45度减去旋转角度对应的弧度
      cornerHypotenuse = Math.sqrt(2 * Math.pow(this.cornerSize, 2)) / 2, // 控制点斜边长度的一半
      cosHalfOffset = cornerHypotenuse * Math.cos(newTheta), // 控制点偏移量对应的余弦值
      sinHalfOffset = cornerHypotenuse * Math.sin(newTheta), // 控制点偏移量对应的正弦值
      sinTh = Math.sin(radian), // 旋转角度对应的正弦值
      cosTh = Math.cos(radian); // 旋转角度对应的余弦值

    coords.tl.corner = {
      tl: {
        x: coords.tl.x - sinHalfOffset,
        y: coords.tl.y - cosHalfOffset,
      },
      tr: {
        x: coords.tl.x + cosHalfOffset,
        y: coords.tl.y - sinHalfOffset,
      },
      bl: {
        x: coords.tl.x - cosHalfOffset,
        y: coords.tl.y + sinHalfOffset,
      },
      br: {
        x: coords.tl.x + sinHalfOffset,
        y: coords.tl.y + cosHalfOffset,
      },
    };

    coords.tr.corner = {
      tl: {
        x: coords.tr.x - sinHalfOffset,
        y: coords.tr.y - cosHalfOffset,
      },
      tr: {
        x: coords.tr.x + cosHalfOffset,
        y: coords.tr.y - sinHalfOffset,
      },
      br: {
        x: coords.tr.x + sinHalfOffset,
        y: coords.tr.y + cosHalfOffset,
      },
      bl: {
        x: coords.tr.x - cosHalfOffset,
        y: coords.tr.y + sinHalfOffset,
      },
    };

    coords.bl.corner = {
      tl: {
        x: coords.bl.x - sinHalfOffset,
        y: coords.bl.y - cosHalfOffset,
      },
      bl: {
        x: coords.bl.x - cosHalfOffset,
        y: coords.bl.y + sinHalfOffset,
      },
      br: {
        x: coords.bl.x + sinHalfOffset,
        y: coords.bl.y + cosHalfOffset,
      },
      tr: {
        x: coords.bl.x + cosHalfOffset,
        y: coords.bl.y - sinHalfOffset,
      },
    };

    coords.br.corner = {
      tr: {
        x: coords.br.x + cosHalfOffset,
        y: coords.br.y - sinHalfOffset,
      },
      bl: {
        x: coords.br.x - cosHalfOffset,
        y: coords.br.y + sinHalfOffset,
      },
      br: {
        x: coords.br.x + sinHalfOffset,
        y: coords.br.y + cosHalfOffset,
      },
      tl: {
        x: coords.br.x - sinHalfOffset,
        y: coords.br.y - cosHalfOffset,
      },
    };

    coords.ml.corner = {
      tl: {
        x: coords.ml.x - sinHalfOffset,
        y: coords.ml.y - cosHalfOffset,
      },
      tr: {
        x: coords.ml.x + cosHalfOffset,
        y: coords.ml.y - sinHalfOffset,
      },
      bl: {
        x: coords.ml.x - cosHalfOffset,
        y: coords.ml.y + sinHalfOffset,
      },
      br: {
        x: coords.ml.x + sinHalfOffset,
        y: coords.ml.y + cosHalfOffset,
      },
    };

    coords.mt.corner = {
      tl: {
        x: coords.mt.x - sinHalfOffset,
        y: coords.mt.y - cosHalfOffset,
      },
      tr: {
        x: coords.mt.x + cosHalfOffset,
        y: coords.mt.y - sinHalfOffset,
      },
      bl: {
        x: coords.mt.x - cosHalfOffset,
        y: coords.mt.y + sinHalfOffset,
      },
      br: {
        x: coords.mt.x + sinHalfOffset,
        y: coords.mt.y + cosHalfOffset,
      },
    };

    coords.mr.corner = {
      tl: {
        x: coords.mr.x - sinHalfOffset,
        y: coords.mr.y - cosHalfOffset,
      },
      tr: {
        x: coords.mr.x + cosHalfOffset,
        y: coords.mr.y - sinHalfOffset,
      },
      bl: {
        x: coords.mr.x - cosHalfOffset,
        y: coords.mr.y + sinHalfOffset,
      },
      br: {
        x: coords.mr.x + sinHalfOffset,
        y: coords.mr.y + cosHalfOffset,
      },
    };

    coords.mb.corner = {
      tl: {
        x: coords.mb.x - sinHalfOffset,
        y: coords.mb.y - cosHalfOffset,
      },
      tr: {
        x: coords.mb.x + cosHalfOffset,
        y: coords.mb.y - sinHalfOffset,
      },
      bl: {
        x: coords.mb.x - cosHalfOffset,
        y: coords.mb.y + sinHalfOffset,
      },
      br: {
        x: coords.mb.x + sinHalfOffset,
        y: coords.mb.y + cosHalfOffset,
      },
    };

    coords.mtr.corner = {
      tl: {
        x: coords.mtr.x - sinHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y - cosHalfOffset - cosTh * this.rotatingPointOffset,
      },
      tr: {
        x: coords.mtr.x + cosHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y - sinHalfOffset - cosTh * this.rotatingPointOffset,
      },
      bl: {
        x: coords.mtr.x - cosHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y + sinHalfOffset - cosTh * this.rotatingPointOffset,
      },
      br: {
        x: coords.mtr.x + sinHalfOffset + sinTh * this.rotatingPointOffset,
        y: coords.mtr.y + cosHalfOffset - cosTh * this.rotatingPointOffset,
      },
    };
  }
}
