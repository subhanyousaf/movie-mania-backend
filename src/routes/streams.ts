import {
  NotFoundError,
  ScrapeMedia,
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";
import { Request, Response, Router } from "express";
import z from "zod";
import { sortEmbedsByRank } from "../utils/utils";

enum StreamType {
  Show = "show",
  Movie = "movie",
}

const streamSchema = z.object({
  type: z.nativeEnum(StreamType),
  title: z.string().min(1, "Title is required"),
  releaseYear: z
    .number()
    .int()
    .min(1900, "Minimum year is 1900")
    .max(2100, "Maximum year is 2100"),
  tmdbId: z.string().min(1, "Provide valid TMDB Id for the stream"),
});

const seasonSchema = z.object({
  number: z.number().int().positive(),
  tmdbId: z.string().min(1, "Provide valid TMDB Id for the season"),
});

const episodeSchema = z.object({
  number: z.number().int().positive(),
  tmdbId: z
    .string({
      required_error: "Provide valid TMDB Id for the episode",
    })
    .min(1),
});

const showSchema = z.object({
  season: seasonSchema,
  episode: episodeSchema,
});

const router = Router();

router.post("/:source?", async (req: Request, res: Response) => {
  const body: ScrapeMedia = req.body;
  const source = req.params.source;

  const streamValidation = streamSchema.safeParse(body);
  if (!streamValidation.success) {
    const error = streamValidation.error.errors[0];
    return res.status(400).send(error.message);
  }

  if (body.type === StreamType.Show) {
    const showValidation = showSchema.safeParse(body);
    if (!showValidation.success) {
      const error = showValidation.error.errors[0];
      return res.status(400).send(error.message);
    }
  }

  const providers = makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
  });

  try {
    if (source) {
      const sources = providers.listSources();
      const embeds = providers.listEmbeds();
      const sourceExists = sources.find((s) => s.id === source);
      if (!sourceExists) {
        return res.status(400).send("Invalid source");
      }

      const embedScrapers = await providers.runSourceScraper({
        id: source,
        media: body,
      });

      const sortedArray = sortEmbedsByRank(
        embedScrapers.embeds,
        embeds
      ).reverse();

      const streamsFound = [];
      for (const embed of sortedArray) {
        try {
          const embedScraperRunner = await providers.runEmbedScraper({
            id: embed.embedId,
            url: embed.url,
          });

          if (embedScraperRunner) {
            const streamData = embedScraperRunner.stream[0];
            if (streamData.type === "file") {
              if (streamData.qualities["unknown"]) continue;
            }
            streamsFound.push(embedScraperRunner.stream[0]);
            continue;
          }
        } catch (error) {
          if (!(error instanceof NotFoundError)) {
            console.log(error);
          }
        }
      }

      return res.status(200).json({
        sourceId: source,
        streams: streamsFound,
      });
    } else {
      const stream = await providers.runAll({
        media: body,
      });

      return res.status(200).json({
        sourceId: stream?.sourceId || null,
        streams: stream ? [stream.stream] : [],
      });
    }
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      console.log(error);
    }
  }

  return res.status(200).json({
    sourceId: null,
    streams: [],
  });
});

router.get("/sources", async (req: Request, res: Response) => {
  console.log("hi");
  const providers = makeProviders({
    fetcher: makeStandardFetcher(fetch),
    target: targets.ANY,
  });
  return res.status(200).json(providers.listSources());
});

export default router;
