import { ChannelState, FeedType, MembraneType } from "@/store/types";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { findNameDescriptionFromMeta } from "./findNameDescriptionFromMeta";
import { joinNeighbourhood } from "../mutations/joinNeighbourhood";

export async function joinChannelFromSharedLink(
  url: string,
  parentPerspectiveUUID: string
): Promise<ChannelState> {
  console.log("Starting sharedperspective join");
  const neighbourhood = await joinNeighbourhood(url);
  console.log(new Date(), "Joined neighbourhood with result", neighbourhood);

  const [typedExpressionLanguages, _] = await getTypedExpressionLanguages(
    neighbourhood.neighbourhood!.meta.links,
    false
  );

  //Read out metadata about the perspective from the meta
  const { name, description } = findNameDescriptionFromMeta(
    neighbourhood.neighbourhood!.meta.links
  );

  //TODO: derive membraneType from link on sharedPerspective
  return {
    neighbourhood: {
      name: name,
      description: description,
      perspective: neighbourhood,
      typedExpressionLanguages: typedExpressionLanguages,
      neighbourhoodUrl: url,
      membraneType: MembraneType.Inherited,
      linkedPerspectives: [],
      linkedNeighbourhoods: [],
      members: [],
      currentExpressionLinks: {},
      currentExpressionMessages: {},
      createdAt: new Date(),
      membraneRoot: parentPerspectiveUUID,
    },
    state: {
      perspectiveUuid: neighbourhood.uuid,
      hasNewMessages: false,
      loadMore: false,
      initialWorkerStarted: false,
      messageLoading: false,
      feedType: FeedType.Signaled,
      notifications: {
        mute: false,
      },
    },
  } as ChannelState;
}
