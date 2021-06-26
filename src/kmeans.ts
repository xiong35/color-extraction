import { getDataList, ImgPixels, mainColorNumber, PixelData, rgb2Hex } from "./shared.ts";

/** 原始数据集, 保存了4个 ImgPixels 数组*/
const dataList = await getDataList();

/********************/
/*      kmeans      */
/********************/

/**
 * 1. 首先随机确定 n 个初始点, 作为第0阶段的主色色盘(当然这个主色和真实主色相差了很多)
 *    这 n 个点称为 n 个质心
 *
 * 即设置 startCenters 为 n 个随机的 rgb 值数组
 */
let startCenters: PixelData[] = new Array(mainColorNumber)
  .fill(0)
  .map(() => {
    return new Array(3)
      .fill(0)
      .map(() => ~~(Math.random() * 255)) as PixelData;
  });

/**
 * 2. 进行迭代, 以改善你的猜测
 *    (1) 根据现有质心的位置对原图像的所有像素进行归类, 离哪个质心最近就设置为哪一类
 *    (2) 根据聚类结果, 算出该类别新的质心(该类所有 r、g、b分别求平均值, 得到的点即为新质心)
 *    (3) 根据算出来的质心, 更新startPoints数组
 *    (4) 重复步骤 (1), 直至收敛(每个质心迭代后改变的距离均小于 minDist)或达到最大迭代次数iterations
 */
let iterations = 20;
const minMoveDist = 25;
/** 计算距离的方法: 将 r,g,b 分别作为空间坐标系的 x,y,z, 计算两点的欧式距离即可 */
function calcDist(pix1: PixelData, pix2: PixelData): number {
  return pix1.reduce(
    (total, cur, index) => total + (cur - pix2[index]) ** 2,
    0
  );
}

/** 每个质心对应的类别包含的点的数组 */
type PixBelongingToCenter = PixelData[];

dataList.forEach((data, index) => {
  console.log(`\n*** processing img ${index + 1} ***\n`);

  while (iterations--) {
    /***** 归类 *****/
    const center2Cluster: PixBelongingToCenter[] = new Array(
      mainColorNumber
    )
      .fill(0)
      .map(() => []);
    data.forEach((pixel) => {
      // 对每个像素计算距离哪个质心最近
      const closestCenterIndex = startCenters.reduce(
        (prev, curCenter, centerIndex) => {
          const dist = calcDist(curCenter, pixel);
          return dist < prev.dist ? { centerIndex, dist } : prev;
        },
        { centerIndex: -1, dist: -Infinity } // 当前距离最近的中心的号码和距离
      ).centerIndex;
      // 将它加入最近的质心的数组中
      center2Cluster[closestCenterIndex].push(pixel);
    });

    /***** 计算新质心 *****/
    const newStartCenters = center2Cluster.map(
      // 对于每一个中心的集合
      (cluster) =>
        cluster
          .reduce(
            // 分别求该集合中各个点 r, g, b 各通道之和
            (total, pixel) => [
              total[0] + pixel[0],
              total[1] + pixel[1],
              total[2] + pixel[2],
            ],
            [0, 0, 0] as PixelData
          )
          .map(
            // 将结果取平均即为新中心
            (totalChannel) => totalChannel / cluster.length
          ) as PixelData
    );

    /***** 判断是否收敛 *****/
    let isSettled = true;
    for (let i = 0; i < mainColorNumber; i++) {
      const moveDist = calcDist(
        newStartCenters[i],
        startCenters[i]
      );
      if (moveDist > minMoveDist) {
        isSettled = false;
        break;
      }
    }
    if (isSettled) break;

    /***** 更新 *****/
    startCenters = newStartCenters;
  }
});

console.log(startCenters.map(rgb2Hex));
