import { FabricObject } from "./FabricObject";
import { Corner, CurrentTransform, GroupSelector, Pos } from "./interface";
import { Offset } from "./types";
import { Util } from "./Util";

export class Canvas {
  public width: number; // 画布宽度
  public height: number; // 画布高度

  public wrapperEl: HTMLElement; // 画布外层容器

  public lowerCanvasEl: HTMLCanvasElement; // 下层 Canvas 元素

  public upperCanvasEl: HTMLCanvasElement; // 上层 Canvas 元素

  public cacheCanvasEl: HTMLCanvasElement; // 缓存 Canvas 元素

  public contextTop: CanvasRenderingContext2D; // 上层 Canvas 上下文

  public contextContainer: CanvasRenderingContext2D; // 下层 Canvas 上下文

  public contextCache: CanvasRenderingContext2D; // 缓存 Canvas 上下文

  private _offset: Offset; // 整个画布到视口上边距/左边距偏移量

  private _objects: FabricObject[]; // 画布上的所有对象

  /** 当前物体的变换信息，src 目录下中有截图 */
  private _currentTransform: CurrentTransform;

  /** 左键拖拽的产生的选择区域，拖蓝区域 */
  private _groupSelector: GroupSelector;

  public containerClass: string = "canvas-container"; // 外层容器的 class

  /** 一些鼠标样式 */
  public defaultCursor: string = "default";
  public hoverCursor: string = "move";
  public moveCursor: string = "move";
  public rotationCursor: string = "crosshair";

  constructor(el: HTMLCanvasElement, options) {
    // 初始化下层画布 lower-canvas
    this._initStatic(el, options);

    // 初始化上层画布 upper-canvas
    this._initInteractive();

    // 初始化缓存画布 cache-canvas
    this._createCacheCanvas();
  }

  _initStatic(el: HTMLCanvasElement, options) {
    this._objects = [];
    this._setOptions(options); // 初始化配置项
    this._createLowerCanvas(el); // 初始化底层画布
    this._initOptions(options);
    this.calcOffset();
  }

  _setOptions(options) {
    for (const prop in options) {
      this[prop] = options[prop];
    }
  }

  _initOptions(options) {
    const lowerCanvasEl = this.lowerCanvasEl;

    this.width = this.width || parseInt(`${lowerCanvasEl.width}`, 10) || 0;
    this.height = this.height || parseInt(`${lowerCanvasEl.height}`, 10) || 0;

    this.lowerCanvasEl.style.width = this.width + "px";
    this.lowerCanvasEl.style.height = this.height + "px";
  }

  _createLowerCanvas(el: HTMLCanvasElement) {
    this.lowerCanvasEl = el;
    Util.addClass(this.lowerCanvasEl, "lower-canvas");
    this._applyCanvasStyle(this.lowerCanvasEl);
    this.contextContainer = this.lowerCanvasEl.getContext("2d");
  }

  /**
   * 设置上下画布层样式
   * @param el
   */
  _applyCanvasStyle(el: HTMLCanvasElement) {
    const width = this.width || el.width;
    const height = this.height || el.height;
    Util.setStyle(el, {
      position: "absolute",
      width: width + "px",
      height: height + "px",
      left: 0,
      top: 0,
    });
    el.width = width;
    el.height = height;

    console.log(`el.width--->`, el.width);
    console.log(`el.height--->`, el.height);
    Util.makeElementUnselectable(el);
  }

  /** 获取画布的偏移量，到时计算鼠标点击位置需要用到 */
  calcOffset(): Canvas {
    this._offset = Util.getElementOffset(this.lowerCanvasEl);
    return this;
  }

  /** 初始化交互层，也就是 upper-canvas */
  _initInteractive() {
    this._currentTransform = null;
    this._groupSelector = null;
    this._initWrapperElement();
    this._createUpperCanvas();
    this._initEvents();
    this.calcOffset();
  }

  /** 创建上层画布，主要用于鼠标交互和涂鸦模式 */
  _createUpperCanvas() {
    this.upperCanvasEl = Util.createCanvasElement();
    this.upperCanvasEl.className = "upper-canvas";
    this.wrapperEl.appendChild(this.upperCanvasEl);
    this._applyCanvasStyle(this.upperCanvasEl);
    this.contextTop = this.upperCanvasEl.getContext("2d");
  }

  _createCacheCanvas() {}

  add(...args): Canvas {
    console.log(`args`, ...args);
    this._objects.push(...args);
    for (let i = args.length; i--; ) {
      this._initObject(args[i]);
    }
    this.renderAll();
    return this;
  }

  _initObject(object: FabricObject) {
    object.setupState();
    object.setCoords();
    object.canvas = this;
    // this.emit("object:added", { target: object });
    // object.emit("added");
  }

  renderAll(): Canvas {
    // 获取下层画布
    const ctx = this.contextContainer;

    // 清除画布
    this.clearContext(ctx);

    // 简单粗暴的遍历渲染
    this._objects.forEach((object) => {
      object.render(ctx);
    });

    return this;
  }

  clearContext(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, this.width, this.height);
  }

  /** 因为我们用了两个 canvas，所以在 canvas 的外面再多包一个 div 容器 */
  _initWrapperElement() {
    this.wrapperEl = Util.wrapElement(this.lowerCanvasEl, "div", {
      class: this.containerClass,
    });
    Util.setStyle(this.wrapperEl, {
      width: this.width + "px",
      height: this.height + "px",
      position: "relative",
    });
    Util.makeElementUnselectable(this.wrapperEl);
  }

  _initEvents() {
    // this._onMouseDown = this._onMouseDown.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    // this._onMouseUp = this._onMouseUp.bind(this);
    // this._onResize = this._onResize.bind(this);

    // Util.addListener(window, "resize", this._onResize);
    // Util.addListener(this.upperCanvasEl, "mousedown", this._onMouseDown);
    Util.addListener(this.upperCanvasEl, "mousemove", this._onMouseMove);
  }

  _onMouseMove(e: MouseEvent) {
    e.preventDefault();
    this.__onMouseMove(e);
  }

  /** 处理鼠标 hover 事件和物体变换时的拖拽事件 */
  __onMouseMove(e: MouseEvent) {
    let target, pointer;

    let groupSelector = this._groupSelector;
    console.log(
      `this._currentTransform`,
      this._currentTransform,
      groupSelector
    );

    if (groupSelector) {
      // 如果有拖蓝框选区域
      // pointer = Util.getPointer(e, this.upperCanvasEl);
      // groupSelector.left = pointer.x - this._offset.left - groupSelector.ex;
      // groupSelector.top = pointer.y - this._offset.top - groupSelector.ey;
      // this.renderTop();
    } else if (!this._currentTransform) {
      // 如果是 hover 事件，这里我们只需要改变鼠标样式，并不会重新渲染
      let style = this.upperCanvasEl.style;
      target = this.findTarget(e);

      console.log(`target---->`, target);

      if (target) {
        this._setCursorFromEvent(e, target);
      } else {
        // image/text was hovered-out from, we remove its borders
        // for (let i = this._objects.length; i--; ) {
        //     if (this._objects[i] && !this._objects[i].active) {
        //         this._objects[i].setActive(false);
        //     }
        // }
        style.cursor = this.defaultCursor;
      }
    }

    // else {
    //   // 如果是旋转、缩放、平移等操作
    //   pointer = Util.getPointer(e, this.upperCanvasEl);

    //   let x = pointer.x,
    //     y = pointer.y;

    //   this._currentTransform.target.isMoving = true;

    //   let t = this._currentTransform,
    //     reset = false;
    //   // if (
    //   //     (t.action === 'scale' || t.action === 'scaleX' || t.action === 'scaleY') &&
    //   //     // Switch from a normal resize to center-based
    //   //     ((e.altKey && (t.originX !== 'center' || t.originY !== 'center')) ||
    //   //         // Switch from center-based resize to normal one
    //   //         (!e.altKey && t.originX === 'center' && t.originY === 'center'))
    //   // ) {
    //   //     this._resetCurrentTransform(e);
    //   //     reset = true;
    //   // }

    //   if (this._currentTransform.action === "rotate") {
    //     // 如果是旋转操作
    //     this._rotateObject(x, y);

    //     this.emit("object:rotating", {
    //       target: this._currentTransform.target,
    //       e,
    //     });
    //     this._currentTransform.target.emit("rotating");
    //   } else if (this._currentTransform.action === "scale") {
    //     // 如果是整体缩放操作
    //     if (e.shiftKey) {
    //       this._currentTransform.currentAction = "scale";
    //       this._scaleObject(x, y);
    //     } else {
    //       if (!reset && t.currentAction === "scale") {
    //         // Switch from a normal resize to proportional
    //         this._resetCurrentTransform(e);
    //       }

    //       this._currentTransform.currentAction = "scaleEqually";
    //       this._scaleObject(x, y, "equally");
    //     }

    //     this.emit("object:scaling", {
    //       target: this._currentTransform.target,
    //       e,
    //     });
    //     this._currentTransform.target.emit("scaling", { e });
    //   } else if (this._currentTransform.action === "scaleX") {
    //     // 如果只是缩放 x
    //     this._scaleObject(x, y, "x");

    //     this.emit("object:scaling", {
    //       target: this._currentTransform.target,
    //       e,
    //     });
    //     this._currentTransform.target.emit("scaling", { e });
    //   } else if (this._currentTransform.action === "scaleY") {
    //     // 如果只是缩放 y
    //     this._scaleObject(x, y, "y");

    //     this.emit("object:scaling", {
    //       target: this._currentTransform.target,
    //       e,
    //     });
    //     this._currentTransform.target.emit("scaling", { e });
    //   } else {
    //     // 如果是拖拽物体
    //     this._translateObject(x, y);

    //     this.emit("object:moving", {
    //       target: this._currentTransform.target,
    //       e,
    //     });

    //     this._setCursor(this.moveCursor);
    //     this._currentTransform.target.emit("moving", { e });
    //   }

    //   this.renderAll();
    // }

    // this.emit("mouse:move", { target, e });
    // target && target.emit("mousemove", { e });
  }
  /** 检测是否有物体在鼠标位置 */
  findTarget(e: MouseEvent, skipGroup: boolean = false): FabricObject {
    let target;
    // let pointer = this.getPointer(e);

    // 优先考虑当前组中的物体，因为激活的物体被选中的概率大
    // let activeGroup = this.getActiveGroup();
    // if (activeGroup && !skipGroup && this.containsPoint(e, activeGroup)) {
    //   target = activeGroup;
    //   return target;
    // }

    // 遍历所有物体，判断鼠标点是否在物体包围盒内
    for (let i = this._objects.length; i--; ) {
      if (this._objects[i] && this.containsPoint(e, this._objects[i])) {
        target = this._objects[i];
        break;
      }
    }
    if (target) return target;
  }

  containsPoint(e: MouseEvent, target: FabricObject): boolean {
    let pointer = this.getPointer(e),
      xy = this._normalizePointer(target, pointer),
      x = xy.x,
      y = xy.y;

    // 下面这是参考文献，不过好像打不开
    // http://www.geog.ubc.ca/courses/klink/gis.notes/ncgia/u32.html
    // http://idav.ucdavis.edu/~okreylos/TAship/Spring2000/PointInPolygon.html

    // we iterate through each object. If target found, return it.
    let iLines = target._getImageLines(target.oCoords),
      xpoints = target._findCrossPoints(x, y, iLines);

    console.log(`xpoints--->`, xpoints);
    // if xcount is odd then we clicked inside the object
    // For the specific case of square images xcount === 1 in all true cases
    if (
      xpoints &&
      xpoints % 2 === 1
      // target._findTargetCorner(e, this._offset)
    ) {
      return true;
    }
    return false;
  }

  /**
   * 获取鼠标基于画布的点击坐标，相对于页面左上角，注意不是画布的左上角，到时候会减掉 offset
   * @param e
   * @returns
   */
  getPointer(e: MouseEvent): Pos {
    let pointer = Util.getPointer(e, this.upperCanvasEl);
    return {
      x: pointer.x - this._offset.left, // 获取鼠标的点击坐标，相对于页面左上角，注意不是画布的左上角，到时候会减掉 offset
      y: pointer.y - this._offset.top,
    };
  }
  /** 如果当前的物体在当前的组内，则要考虑扣去组的 top、left 值 */
  _normalizePointer(object: FabricObject, pointer: Pos) {
    // let activeGroup = this.getActiveGroup(),
    let x = pointer.x,
      y = pointer.y;

    // let isObjectInGroup =
    //   activeGroup && object.type !== "group" && activeGroup.contains(object);

    // if (isObjectInGroup) {
    //   x -= activeGroup.left;
    //   y -= activeGroup.top;
    // }
    return { x, y };
  }
  /** 根据鼠标位置来设置相应的鼠标样式 */
  _setCursorFromEvent(e: MouseEvent, target: FabricObject): boolean {
    let s = this.upperCanvasEl.style;
    if (target) {
      // let activeGroup = this.getActiveGroup();
      // let corner =
      //   (!activeGroup || !activeGroup.contains(target)) &&
      //   target._findTargetCorner(e, this._offset);

      // if (corner) {
      //   corner = corner as string;
      //   if (corner in cursorMap) {
      //     s.cursor = cursorMap[corner];
      //   } else if (corner === "mtr" && target.hasRotatingPoint) {
      //     s.cursor = this.rotationCursor;
      //   } else {
      //     s.cursor = this.defaultCursor;
      //     return false;
      //   }
      // } else {
      s.cursor = this.hoverCursor;
      // }
      return true;
    } else {
      s.cursor = this.defaultCursor;
      return false;
    }
  }
}
