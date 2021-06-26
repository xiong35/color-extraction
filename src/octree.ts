import { getDataList, mainColorNumber, PixelData, rgb2Hex } from "./shared.ts";

/** 原始数据集, 保存了4个 ImgPixels 数组*/
const dataList = await getDataList();

/********************/
/*      octree      */
/********************/

/**
 * 0. 将每个点的 RGB 表示为二进制的一行, 堆叠后将每一列的不同编码对应成数字, 共 8 种组合
 *    RGB 通道逐列黏合之后的值就是其在某一层节点的子节点
 *    e.g. 如#FF7800，其中 R 通道为0xFF，也就是255，G 为 0x78 也就是120，B 为 0x00 也就是0。
 *         接下来我们把它们写成二进制逐行放下，那么就是：
 *          R: 1111 1111
 *          G: 0111 1000
 *          B: 0000 0000
 *         上述颜色的第一位黏合起来是100(2)，转化为十进制就是 4，所以这个颜色在第一层是放在根节点的第5个子节点当中
 *         第二位是 110(2) 也就是 6，那么它就是根节点的第5个儿子的第7个儿子
 * 1. 建立一棵空八叉树, 设置一个叶子节点个数上限
 * 2. 依次将像素按 0. 的算法插入树中
 *     (1) 若插入后叶子节点数小于上限, 则什么也不做
 *     (2) 若大于上限, 则对最底层的一个非叶子节点进行合并
 *         将其转换为叶子节点 rgb 值的平均数, 并清除其子节点
 * 3. 依此类推, 直到最后插入所有的像素, 所得八叉树的叶子节点即为主色调
 */

class Node {
  static leafNum = 0;
  static toReduce: Node[][] = new Array(8).fill(0).map(() => []);

  children: (Node | null)[] = new Array(8).fill(null);
  isLeaf = false;
  r = 0;
  g = 0;
  b = 0;
  childrenCount = 0;

  constructor(info?: { index: number; level: number }) {
    if (!info) return;
    if (info.level === 7) {
      this.isLeaf = true;
      Node.leafNum++;
    } else {
      Node.toReduce[info.level].push(this);
      Node.toReduce[info.level].sort(
        (a, b) => a.childrenCount - b.childrenCount
      );
    }
  }

  addColor(color: PixelData, level: number) {
    if (this.isLeaf) {
      this.childrenCount++;
      this.r += color[0];
      this.g += color[1];
      this.b += color[2];
    } else {
      let str = "";
      const r = color[0].toString(2).padStart(8, "0");
      const g = color[1].toString(2).padStart(8, "0");
      const b = color[2].toString(2).padStart(8, "0");

      str += r[level];
      str += g[level];
      str += b[level];
      const index = parseInt(str, 2);

      if (this.children[index] === null) {
        this.children[index] = new Node({
          index,
          level: level + 1,
        });
      }
      (this.children[index] as Node).addColor(color, level + 1);
    }
  }
}
function reduceTree() {
  // find the deepest level of node
  let lv = 6;

  while (lv >= 0 && Node.toReduce[lv].length === 0) lv--;
  if (lv < 0) return;

  const node = Node.toReduce[lv].pop() as Node;

  // merge children
  node.isLeaf = true;
  node.r = 0;
  node.g = 0;
  node.b = 0;
  node.childrenCount = 0;
  for (let i = 0; i < 8; i++) {
    if (node.children[i] === null) continue;
    const child = node.children[i] as Node;
    node.r += child.r;
    node.g += child.g;
    node.b += child.b;
    node.childrenCount += child.childrenCount;
    Node.leafNum--;
  }

  Node.leafNum++;
}

function colorsStats(node: Node, record: Record<string, number>) {
  if (node.isLeaf) {
    const r = (~~(node.r / node.childrenCount))
      .toString(16)
      .padStart(2, "0");
    const g = (~~(node.g / node.childrenCount))
      .toString(16)
      .padStart(2, "0");
    const b = (~~(node.b / node.childrenCount))
      .toString(16)
      .padStart(2, "0");

    const color = "#" + r + g + b;
    if (record[color]) record[color] += node.childrenCount;
    else record[color] = node.childrenCount;

    return;
  }

  for (let i = 0; i < 8; i++) {
    if (node.children[i] !== null) {
      colorsStats(node.children[i] as Node, record);
    }
  }
}

dataList.forEach((data, index) => {
  console.log(`\n*** processing img ${index + 1} ***\n`);
  const root = new Node();

  Node.toReduce = new Array(8).fill(0).map(() => []);
  Node.leafNum = 0;

  data.forEach((pixel, index) => {
    root.addColor(pixel, 0);

    while (Node.leafNum > 16) reduceTree();
  });

  const record: Record<string, number> = {};
  colorsStats(root, record);
  const result = Object.entries(record)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  console.log(result.map(([color, _]) => color));

  /* 
    *** processing img 1 ***

    [ "#0c0e1e", "#bab2a6", "#5a5e65", "#263448" ]

    *** processing img 2 ***

    [ "#4c4148", "#75b2b1", "#d2d2d1", "#a2a1a2" ]

    *** processing img 3 ***

    [ "#393144", "#d5bba7", "#9b5c69", "#d29370" ]

    *** processing img 4 ***

    [ "#4e1c2f", "#a11227", "#c21b2a", "#c95e28" ]
  */
});
