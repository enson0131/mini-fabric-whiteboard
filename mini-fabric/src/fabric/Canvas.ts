import { FabricObject } from "./FabricObject";
import { CurrentTransform, GroupSelector } from "./interface";
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
    // this._initEvents(); TODO 上层事件处理
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
    this.renderAll();
    return this;
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
}
