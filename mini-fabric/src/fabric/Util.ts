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

  // /**
  //  * 实现一个 AABB 包围盒
  //  * @param points
  //  */
  // static makeBoundingBoxFromPoints(points: any[]) {
  //   const xPoints = points.map((p) => p.x);
  //   const yPoints = points.map((p) => p.y);
  //   const minX = Math.min(...xPoints);
  //   const minY = Math.min(...yPoints);
  //   const maxX = Math.max(...xPoints);
  //   const maxY = Math.max(...yPoints);
  //   const width = maxX - minX;
  //   const height = maxY - minY;

  //   return {
  //     left: minX,
  //     top: minY,
  //     width,
  //     height,
  //   };
  // }
  /**
   * Apply transform t to point p
   * @static
   * @memberOf fabric.util
   * @param  {fabric.Point} p The point to transform
   * @param  {Array} t The transform
   * @param  {Boolean} [ignoreOffset] Indicates that the offset should not be applied
   * @return {fabric.Point} The transformed point
   */
  static transformPoint(p, t, ignoreOffset?: boolean) {
    if (ignoreOffset) {
      return new Point(t[0] * p.x + t[2] * p.y, t[1] * p.x + t[3] * p.y);
    }
    return new Point(
      t[0] * p.x + t[2] * p.y + t[4],
      t[1] * p.x + t[3] * p.y + t[5]
    );
  }
  /**
   * Returns coordinates of points's bounding rectangle (left, top, width, height)
   * @param {Array} points 4 points array
   * @param {Array} [transform] an array of 6 numbers representing a 2x3 transform matrix
   * @return {Object} Object with left, top, width, height properties
   */
  static makeBoundingBoxFromPoints(points, transform) {
    if (transform) {
      for (let i = 0; i < points.length; i++) {
        points[i] = Util.transformPoint(points[i], transform);
      }
    }
    const xPoints = [points[0].x, points[1].x, points[2].x, points[3].x],
      minX = Math.min(...xPoints),
      maxX = Math.max(...xPoints),
      width = maxX - minX,
      yPoints = [points[0].y, points[1].y, points[2].y, points[3].y],
      minY = Math.min(...yPoints),
      maxY = Math.max(...yPoints),
      height = maxY - minY;
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

  /**
   * 元素获取包围盒的宽高
   * @memberOf fabric.util
   * @param {Number} width
   * @param {Number} height
   * @param {Object} options
   * @param {Number} options.scaleX
   * @param {Number} options.scaleY
   * @param {Number} options.skewX
   * @param {Number} options.skewY
   * @return {Object.x} width of containing
   * @return {Object.y} height of containing
   */
  static sizeAfterTransform(width, height, options) {
    const dimX = width / 2,
      dimY = height / 2,
      points = [
        {
          // 左上角
          x: -dimX,
          y: -dimY,
        },
        {
          // 右上角
          x: dimX,
          y: -dimY,
        },
        {
          // 左下角
          x: -dimX,
          y: dimY,
        },
        {
          // 右下角
          x: dimX,
          y: dimY,
        },
      ],
      transformMatrix = Util.calcDimensionsMatrix(options), // 计算变换矩阵
      bbox = Util.makeBoundingBoxFromPoints(points, transformMatrix); // 计算包围盒
    return {
      x: bbox.width,
      y: bbox.height,
    };
  }

  /**
   * Returns a transform matrix starting from an object of the same kind of
   * the one returned from qrDecompose, useful also if you want to calculate some
   * transformations from an object that is not enlived yet.
   * is called DimensionsTransformMatrix because those properties are the one that influence
   * the size of the resulting box of the object.
   * @static
   * @memberOf fabric.util
   * @param  {Object} options
   * @param  {Number} [options.scaleX]
   * @param  {Number} [options.scaleY]
   * @param  {Boolean} [options.flipX]
   * @param  {Boolean} [options.flipY]
   * @param  {Number} [options.skewX]
   * @param  {Number} [options.skewY]·
   * @return {Number[]} transform matrix
   */
  static calcDimensionsMatrix(options) {
    const scaleX = typeof options.scaleX === "undefined" ? 1 : options.scaleX;
    const scaleY = typeof options.scaleY === "undefined" ? 1 : options.scaleY;
    let scaleMatrix = [
      options.flipX ? -scaleX : scaleX,
      0,
      0,
      options.flipY ? -scaleY : scaleY,
      0,
      0,
    ];
    const multiply = Util.multiplyTransformMatrices;
    const degreesToRadians = Util.degreesToRadians;
    if (options.skewX) {
      scaleMatrix = multiply(
        scaleMatrix,
        // Math.tan 计算倾斜角度的正切值
        [1, 0, Math.tan(degreesToRadians(options.skewX)), 1],
        true // 因为不涉及平移，所以是 true
      );
    }
    if (options.skewY) {
      scaleMatrix = multiply(
        scaleMatrix,
        [1, Math.tan(degreesToRadians(options.skewY)), 0, 1],
        true
      );
    }
    return scaleMatrix;
  }

  /**
   * 矩阵乘法
   * C = A × B
   * C[i][j] = Σ A[i][k] × B[k][j]
   * a[0] a[2] a[4]    // 第一行：a, c, e
     a[1] a[3] a[5]    // 第二行：b, d, f
      0     0     1     // 第三行：恒定值
   * 
     
      b[0] b[2] b[4]
      b[1] b[3] b[5]
      0     0     1
   * @static
   * @memberOf fabric.util
   * @param  {Array} a First transformMatrix
   * @param  {Array} b Second transformMatrix
   * @param  {Boolean} is2x2 flag 一个布尔值，指示是否只进行 2x2 矩阵乘法。
   * @return {Array} The product of the two transform matrices
   */
  static multiplyTransformMatrices(a, b, is2x2) {
    return [
      a[0] * b[0] + a[2] * b[1],
      a[1] * b[0] + a[3] * b[1],
      a[0] * b[2] + a[2] * b[3],
      a[1] * b[2] + a[3] * b[3],
      is2x2 ? 0 : a[0] * b[4] + a[2] * b[5] + a[4],
      is2x2 ? 0 : a[1] * b[4] + a[3] * b[5] + a[5],
    ];
  }
}
