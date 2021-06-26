
# 图像主色提取算法

我们在网易云上听歌, 略加设置就能在能看到这样的效果:

![netease](http://blog.xiong35.cn/mmcq/netease.jpg)

本仓库实现了 3 种常见的图片主色调提取算法, 即 [kmeans聚类](src/kmeans.ts), [中位切分算法](src/midCut.ts)
和[八叉树划分法](src/octree.ts).

## 项目结构

```txt
/imgs
  /test
    *.jpg               所用测试数据
    imgData.json        测试图片转化为位图后的像素信息
  /blog
    /scatter
      *.jpg             可视化的图片像素点
    /其他文件夹          提取后的结果
/src
  dump2JSON.py          将图片导出为 json 数据
  index.html            展示色块的小网页
  kmeans.ts             **kmeans 聚类的实现**
  midCut.ts             **中位切分的实现**
  octree.ts             **八叉树的实现**
  scatterImg.py         对图片进行可视化
  shared.ts             ts 文件公用的定义及工具函数
图像主色提取算法.md       产出的笔记
```

## 运行

> 需要 deno 和 python3 环境

```shell
git clone git@github.com:xiong35/color-extraction.git

cd color-extraction/src

python dump2JSON.py     # 需先导出 json 文件
deno run -A kmeans.ts
deno run -A midCut.ts
deno run -A octree.ts

```

**详细可见[笔记](图像主色提取算法.md)**
