import { MetaOutput } from "@movie-web/providers";

declare type SourcererEmbed = {
  embedId: string;
  url: string;
};

export function sortEmbedsByRank(
  arrayOne: SourcererEmbed[],
  arrayTwo: MetaOutput[]
): SourcererEmbed[] {
  const rankMap: Record<string, number> = arrayTwo.reduce((acc, obj) => {
    acc[obj.id] = obj.rank;
    return acc;
  }, {} as Record<string, number>);

  arrayOne.sort((a, b) => {
    const rankA = rankMap[a.embedId];
    const rankB = rankMap[b.embedId];

    if (rankA === undefined) return 1;
    if (rankB === undefined) return -1;

    return rankA - rankB;
  });

  return arrayOne;
}

export function isValidHttpUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

export function isVideoUrl(url: string): boolean {
  console.log(new RegExp(".m3u8\b|.mp4\b").test(url));
  return new RegExp(".m3u8\b|.mp4\b").test(url);
}
