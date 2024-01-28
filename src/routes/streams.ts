import {
  ScrapeMedia,
  makeProviders,
  makeStandardFetcher,
  targets,
} from "@movie-web/providers";
import { Request, Response, Router } from "express";
import z from "zod";

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

router.post("/", async (req: Request, res: Response) => {
  const body: ScrapeMedia = req.body;

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
    consistentIpForRequests: false,
  });

  const stream = await providers.runAll({
    media: body
  });

  return res.status(200).json(stream);
});

export default router;
