import { DefaultService } from "$/client"

export const load = async () => {
  console.log("Loading summary page")
  return {
    stats: (await DefaultService.stats()).data,
    services: (await DefaultService.services()).data
  }
}