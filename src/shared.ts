/** 一个像素的信息由 r, g, b 的值构成 */
export type PixelData = [number, number, number];
/** 一张图片的信息由若干像素点构成 */
export type ImgPixels = PixelData[];

export async function getDataList(): Promise<ImgPixels[]> {
  const dataList: ImgPixels[] = [];
  for (let i = 0; i < 4; i++) {
    const json = await Deno.readTextFile(
      `../imgs/test/imgData${i + 1}.json`
    );
    const data = JSON.parse(json) as ImgPixels;
    dataList.push(data);
  }

  return dataList;
}

export const mainColorNumber = 4;

export function rgb2Hex(pixel: PixelData): string {
  return pixel.reduce((prevStr, channel) => {
    return prevStr + channel.toString(16).padStart(2, "0");
  }, "#");
}
