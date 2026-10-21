# 海风慢慢 · Pelican Seaside

一只鹈鹕，一辆自行车，一段不赶时间的海岸旅程。

原创 SVG 插画与原生 JavaScript 动画。单文件、零依赖，无需安装或构建，下载后用浏览器打开 `index.html` 即可离线播放。

## 体验

- 薄荷绿自行车、橘红围巾、暖色海岸与月夜。
- 双腿采用两骨骼逆运动学（IK），脚始终跟随踏板；远近腿分层绘制。
- 水平脚踏、按齿比旋转的车轮、流动链条，以及随踏频起伏的身体。
- 海浪、帆船、云朵、路边花草与同步滚动的路面。
- 暂停／继续、0.25–2× 调速、昼夜切换、腿部骨架展示。
- 手机布局、键盘空格键暂停、减少动态效果设置、后台自动暂停更新。

## 在线访问

[打开海风慢慢 · 在线动画](https://wwp611.github.io/pelican-seaside/)

已启用 GitHub Pages，从 `main` 分支根目录发布；后续推送会自动更新网站。

## 实现

用统一的模拟时间驱动所有动态元素。左右踏板相差 π，脚踝目标位于踏板上方；髋关节随身体起伏，膝盖由定长大腿与小腿的圆交点解算，选取朝前弯折的分支。车轮角速度由踏频与齿比决定，路面位移由轮半径计算，调速、暂停时一起生效。

动画绘图与代码为本项目重新创作。技术调研参考以下项目的 SVG 分层、IK 和动画组织思路，没有复制它们的美术素材或源代码：

- https://github.com/56gfy/pelican-bicycle
- https://github.com/kings0527/pelican-bicycle
- https://github.com/CwC-HydeX/pelican-cycle
- https://github.com/toankhontech/pelican-test-opus55

## 验证

`tests/verify.cjs` 直接运行页面中的动画逻辑，在可重复的 DOM／时钟环境中验证完整踩踏周期的腿长、接触点、相位，以及暂停、调速、昼夜切换、骨架开关、手机取景和减少动态效果。只需要 Node.js，无第三方依赖；实际画面还需浏览器检查：

```sh
node tests/verify.cjs
```

## 许可

MIT，详见 LICENSE。
