import { getDataList, mainColorNumber, PixelData, rgb2Hex } from "./shared.ts";

/** 原始数据集, 保存了4个 ImgPixels 数组*/
const dataList = await getDataList();

/********************/
/*      mid cut     */
/********************/

/**
 * 1. 将图片每个像素的 r,g,b 值分别作为 x,y,z 坐标, 标在空间坐标系中
 * 2. 用一个最小的立方体框住所有点
 * 3. 将立方体沿一平面切分, 该平面与立方体最长边方向垂直, 使切分得的两部分包含相同数量的像素点
 * 4. 将分得的小立方体递归地按照 3. 的算法切分, 直至分得立方体个数等于所需颜色数即可
 * 5. 将每个立方体中颜色做平均, 即得到最后颜色板
 */

interface ToCut {
  data: PixelData[]; // 待切分数据
  density: number; // 每单位体积包含的像素点数量
}

/** 计算所给的 data 数组包含的像素点应切分成哪两段 */
function cutIntoTwo(data: PixelData[]): [ToCut, ToCut] {
  // 找到最小的框
  let minNMax = [
    Infinity, // rMin
    -Infinity, // rMax
    Infinity, // gMin
    -Infinity, // gMax
    Infinity, // bMin
    -Infinity, // bMax
  ];
  data.forEach((pixel) => {
    for (let i = 0; i < 3; i++) {
      minNMax[i] = Math.min(minNMax[i], pixel[i]);
      minNMax[i + 1] = Math.max(minNMax[i], pixel[i]);
    }
  });

  // 根据 r/g/b 切分
  let cutBy = -1,
    maxEdge = -Infinity;
  for (let i = 0; i < 3; i++) {
    const curEdge = minNMax[i + 1] - minNMax[i];
    if (curEdge > maxEdge) {
      maxEdge = curEdge;
      cutBy = i;
    }
  }

  const halfNum = ~~(data.length / 2);
  // 按照 toCut 排序, 前一半放一边, 后一半放一边
  const sortedData = [...data].sort((a, b) => a[cutBy] - b[cutBy]);

  const toCutLeft: ToCut = {
      data: sortedData.slice(0, halfNum),
      density: 0,
    },
    toCutRight: ToCut = {
      data: sortedData.slice(halfNum),
      density: 0,
    };
  let vLeft = 1,
    vRight = 1;
  for (let i = 0; i < 3; i++) {
    if (i === cutBy) {
      vLeft *= sortedData[halfNum][cutBy] - minNMax[i]; // 中位数 - min
      vRight *= minNMax[i + 1] - sortedData[halfNum][cutBy]; // max - 中位数
    } else {
      vLeft *= minNMax[i + 1] - minNMax[i];
      vRight *= minNMax[i + 1] - minNMax[i];
    }
  }
  toCutLeft.density = toCutLeft.data.length / (vLeft || 0.0001);
  toCutRight.density = toCutRight.data.length / (vRight || 0.0001);

  return [toCutLeft, toCutRight];
}

dataList.forEach((data, index) => {
  console.log(`\n*** processing img ${index + 1} ***\n`);

  // 按 density 升序, 优先 pop density 最大的进行切分
  let toCutList: ToCut[] = [{ data, density: 0 }];

  while (toCutList.length < mainColorNumber) {
    const toCut = toCutList.pop() || { data: [] };
    const res = cutIntoTwo(toCut.data);
    toCutList = toCutList.concat(res);
    toCutList.sort((a, b) => a.density - b.density);
  }

  const result = toCutList
    .sort((a, b) => b.data.length - a.data.length) // 按包含点个数降序排
    .map(
      (obj) =>
        // 计算rgb通道值的总数
        obj.data
          .reduce(
            (total, curPix) => [
              total[0] + curPix[0],
              total[1] + curPix[1],
              total[2] + curPix[2],
            ],
            [0, 0, 0] as PixelData
          )
          .map(
            (channel) => ~~(channel / obj.data.length)
          ) as PixelData // 取平均
    );

  console.log(result.map(rgb2Hex));

  /* 
    *** processing img 1 ***    
    [ "#080816", "#090b1a", "#101527", "#64656b" ]    
    *** processing img 2 ***    
    [ "#7e9798", "#c6b0b4", "#433a40", "#514a50" ]    
    *** processing img 3 ***    
    [ "#a87d7e", "#3f4055", "#16131d", "#242134" ]    
    *** processing img 4 ***    
    [ "#382336", "#972c37", "#8f0f23", "#871426" ]*/
});
