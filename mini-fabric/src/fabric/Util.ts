import { Point } from "./Point";
import { Offset } from "./types";

const PiBy180 = Math.PI / 180; // 1弧度

export class Util {
  /**
   * 创建一个 canvas 元素
   * @returns
   */
  static createCanvasElement() {
    const canvas = document.createElement("canvas");
    return canvas;
  }

  /**
   * 角度转弧度
   * 弧度 = 角度 * Math.PI / 180
   * @param degress
   */
  static degreesToRadians(degress: number): number {
    return degress * PiBy180;
  }

  /**
   * 弧度转角度
   * 角度 = 弧度 * 180 / Math.PI
   * @param radians
   */
  static radiansToDegress(radians: number): number {
    return radians / PiBy180;
  }

  /**
   * 从数组中移除某个元素
   * @param arr - 数组
   * @param item - 元素
   * @returns
   */
  static removeFormArray(arr: any[], item: any) {
    const index = arr.indexOf(item);
    if (index !== -1) {
      arr.splice(index, 1);
    }

    return arr;
  }

  static clone(obj) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const temp = new obj.constructor();

    for (const key in obj) {
      if (!obj[key] || typeof obj[key] !== "object") {
        temp[key] = obj[key];
      } else {
        temp[key] = Util.clone(obj[key]);
      }
    }

    return temp;
  }

  static loadImage(url, options: any = {}) {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");

      const done = () => {
        img.onload = img.onerror = null;
        resolve(img);
      };

      if (!url) {
        done();
        return;
      }

      img.onload = done;
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      options?.crossOrigin && (img.crossOrigin = options.crossOrigin);
      img.src = url;
    });
  }

  /**
   * 实现一个 AABB 包围盒
   * @param points
   */
  static makeBoundingBoxFromPoints(points: any[]) {
    const xPoints = points.map((p) => p.x);
    const yPoints = points.map((p) => p.y);
    const minX = Math.min(...xPoints);
    const minY = Math.min(...yPoints);
    const maxX = Math.max(...xPoints);
    const maxY = Math.max(...yPoints);
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      left: minX,
      top: minY,
      width,
      height,
    };
  }

  /** 和原生的 toFixed 一样，只不过返回的数字 */
  static toFixed(number: number | string, fractionDigits: number): number {
    return parseFloat(Number(number).toFixed(fractionDigits));
  }

  /**
   * 把源对象的某些属性赋值给目标对象
   * @param source 源对象
   * @param destination 目标对象
   * @param properties 需要赋值的属性
   */
  static populateWithProperties(source, destination, properties) {
    if (properties && Array.isArray(properties)) {
      for (let i = 0, len = properties.length; i < len; i++) {
        destination[properties[i]] = source[properties[i]];
      }
    }
  }

  /**
   * 需要进一步推导看看 - 推导公式: https://jingyan.baidu.com/article/2c8c281dfbf3dd0009252a7b.html
   * 将 point 绕 origin 旋转 radians 弧度
   * @param {Point} point 要旋转的点
   * @param {Point} origin 旋转中心点
   * @param {number} radians 注意 canvas 中用的都是弧度
   * @returns
   */
  static rotatePoint(point: Point, origin: Point, radians: number): Point {
    const sin = Math.sin(radians),
      cos = Math.cos(radians);

    point.subtractEquals(origin);

    const rx = point.x * cos - point.y * sin; // 矩阵运算
    const ry = point.x * sin + point.y * cos;

    return new Point(rx, ry).addEquals(origin);
  }

  /** 给元素添加类名 */
  static addClass(element: HTMLElement, className: string) {
    if ((" " + element.className + " ").indexOf(" " + className + " ") === -1) {
      element.className += (element.className ? " " : "") + className;
    }
  }

  /** 给元素设置样式 */
  static setStyle(element: HTMLElement, styles: string | Record<string, any>) {
    const elementStyle = element.style;

    if (typeof styles === "string") {
      element.style.cssText += ";" + styles;
      return element;
    }

    for (const property in styles) {
      elementStyle[property] = styles[property];
    }
    return element;
  }

  /** 设置元素透明度 */
  static setOpacity(element: HTMLElement, value: string) {
    element.style.opacity = value;
    return element;
  }

  /** 设置 css 的 userSelect 样式为 none，也就是不可选中的状态 */
  static makeElementUnselectable(element: HTMLElement): HTMLElement {
    element.style.userSelect = "none";
    return element;
  }

  /** 计算元素偏移值 */
  static getElementOffset(element): Offset {
    let valueT = 0,
      valueL = 0;
    do {
      valueT += element.offsetTop || 0; // HTMLElement.offsetTop 为只读属性，它返回当前元素相对于其 offsetParent 元素的顶部内边距的距离。
      valueL += element.offsetLeft || 0;
      element = element.offsetParent;
    } while (element);
    return { left: valueL, top: valueT };
  }

  /** 包裹元素并替换 */
  static wrapElement(
    element: HTMLElement,
    wrapper: HTMLElement | string,
    attributes
  ) {
    if (typeof wrapper === "string") {
      wrapper = Util.makeElement(wrapper, attributes);
    }
    if (element.parentNode) {
      element.parentNode.replaceChild(wrapper, element);
    }
    wrapper.appendChild(element);
    return wrapper;
  }

  /** 新建元素并添加相应属性 */
  static makeElement(tagName: string, attributes) {
    const el = document.createElement(tagName);
    for (const prop in attributes) {
      if (prop === "class") {
        el.className = attributes[prop];
      } else {
        el.setAttribute(prop, attributes[prop]);
      }
    }
    return el;
  }
}
