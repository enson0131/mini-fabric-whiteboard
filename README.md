# mini-fabric-whiteboard

使用fabric实现画板功能，支持画笔，绘制直线，矩形，圆形，文字，移动缩放画布，撤销重做，插入图片，清屏与保存功能

# 访问链接

https://enson0131.github.io/mini-fabric-whiteboard/

# 启动

```shell
yarn
yarn dev
```

# 功能
- 通过 option + 鼠标 拖动画布
- 滚动鼠标滚轮缩放画布

# 坑点
1. fabric 默认没有支持擦出功能，可以在 npm 包里面的 mixin 获取对应的擦出功能包


# 参考
1. fabric.js文档：http://fabricjs.com/docs/
2. https://github.com/CC4J/fabric-drawing-board-plugin-demo
3. https://github1s.com/CC4J/fabric-drawing-board/tree/master
4. https://juejin.cn/post/6979135887485435918?searchId=20241127103227E0EBB2688A4372FD09E4
5. https://juejin.cn/post/6993801903121367048?searchId=20241127103227E0EBB2688A4372FD09E4
6. https://fabricjs.com/demos/free-drawing/
7. https://www.imgeek.net/article/825363377
8. https://gitee.com/dhb_bo/fabricjs-demo
9. https://antv.vision/infinite-canvas-tutorial/zh/guide/lesson-006
10. https://medium.com/@sagarmohanty2k00/creating-a-digital-whiteboard-element-with-react-js-d4924ee2c58e
11. https://github.com/thfrei/infinite-drawing-canvas
12. https://keelii.com/2021/05/09/fabricjs-internals

## 如何实现全局漫游

通过 viewportTransform 做平移、缩放就好了
通过 tramsform api 做矩阵变化，参数 是一个数组，里面有6个元素，默认值是 [1, 0, 0, 1, 0, 0]。

[0]: 水平缩放（x轴方向）
[1]: 水平倾斜（x轴方向）
[2]: 垂直倾斜（y轴方向）
[3]: 垂直缩放（y轴方向）
[4]: 水平移动（x轴方向）
[5]: 垂直移动（y轴方向

- https://juejin.cn/post/7142664492122374158?from=search-suggest

## 如何实现缩放画布

1 先修改 viewportTransform[0]、viewportTransform[3] 达到缩放横纵坐标的值
2 通过修改 viewportTransform[4]、viewportTransform[5] 达到平移画布的效果，确保缩放的中心点不变
3 然后重新渲染画布就好了

- https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/transform#matrix

![alt text](image.png)

## 如何实现插入图片
通过 imageSmoothingEnabled 设置为 true 加了这个属性，用于对缩放后的图片进行平滑处理
再通过 drawImage 绘制图片

## 如何实现插入文本
双击创建一个 input 输入框，失去焦点后获取 input 的值，然后将文本添加到画布上

## 如何实现擦除功能
1 通过设置 globalCompositeOperation 为 destination-out 实现擦除功能
2 使用 clip - https://developer.mozilla.org/zh-CN/docs/Web/API/CanvasRenderingContext2D/clip，目前 fabric.js 使用的是这个方式

## 如何实现撤销重做功能

## 如何实现编辑功能

## 书写性能优化

- https://juejin.cn/post/6844903834179878925#heading-2



## 计算机图形学
- https://www.bilibili.com/video/BV1X7411F744/