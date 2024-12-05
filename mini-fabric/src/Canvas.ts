import { FabricObject } from "./FabricObject";

interface Offset {
  left: number;
  top: number;
}

export class Canvas {
  public width: number; // 画布宽度
  public height: number; // 画布高度

  public wrapperEl: HTMLElement; // 画布外层容器

  public lowerCanvasEl: HTMLCanvasElement; // 下层 Canvas 元素

  public uppderCanvasEl: HTMLCanvasElement; // 上层 Canvas 元素

  public cacheCanvasEl: HTMLCanvasElement; // 缓存 Canvas 元素

  public contextTop: CanvasRenderingContext2D; // 上层 Canvas 上下文

  public contextContainer: CanvasRenderingContext2D; // 下层 Canvas 上下文

  public contextCache: CanvasRenderingContext2D; // 缓存 Canvas 上下文

  private _offset: Offset; // 整个画布到视口上边距/左边距偏移量

  private _objects: FabricObject[]; // 画布上的所有对象

  constructor(el: HTMLCanvasElement, options) {
    // 初始化下层画布 lower-canvas
    this._initStatic(el, options);

    // 初始化上层画布 upper-canvas
    this._initInteractive();

    // 初始化缓存画布 cache-canvas
    this._createCacheCanvas();
  }

  _initStatic(el: HTMLCanvasElement, options) {
    this.lowerCanvasEl = el;
    console.log(`options: `, options);
    // this.contextTop = this.lowerCanvasEl.getContext("2d");
  }

  _initInteractive() {}

  _createCacheCanvas() {}

  add(...args): Canvas {
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
}
