import { Point } from "./Point";

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
}
