import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";
import { CHANNEL, SELF } from "utils/constants/communityPredicates";
import {
  getMetaFromNeighbourhood,
  getGroupMetadata,
} from "utils/helpers/getMetaFromNeighbourhood";
import { LinkExpression, Literal, PerspectiveProxy } from "@perspect3vism/ad4m";
import { useDataStore } from ".";
import { CommunityState, LocalCommunityState } from "../types";
import { getCommunityMetadata } from "utils/api/getCommunityMetadata";
import { useUserStore } from "../user";
import getProfile from "utils/api/getProfile";
import { LinkQuery } from "@perspect3vism/ad4m";

export async function getMetaFromLinks(links: LinkExpression[]) {
  const client = await getAd4mClient();
  const langs = links.map((link) => client.languages.meta(link.data.target));
  return Promise.all(langs);
}

export async function buildCommunity(perspective: PerspectiveProxy) {
  const dataStore = useDataStore();
  const community = dataStore.getCommunity(perspective.uuid);

  let state: LocalCommunityState = {
    perspectiveUuid: perspective.uuid,
    theme: {
      fontSize: "md",
      fontFamily: "DM Sans",
      name: "default",
      hue: 270,
      saturation: 60,
    },
    useLocalTheme: false,
    currentChannelId: null,
    hideMutedChannels: false,
    hasNewMessages: false,
    collapseChannelList: false,
    notifications: {
      mute: false,
    },
  };

  if (community && community.state) {
    state = community.state;
  }

  const meta = getMetaFromNeighbourhood(
    perspective.neighbourhood?.meta?.links!
  );

  const groupExp = await getCommunityMetadata(perspective.uuid);

  return {
    neighbourhood: {
      uuid: perspective.uuid,
      author: meta.author,
      timestamp: new Date().toISOString(),
      name: groupExp?.name || meta.name,
      creatorDid: meta.author,
      description: groupExp?.description || meta.description,
      image: groupExp?.image || "",
      thumbnail: groupExp?.thumbnail || "",
      neighbourhoodUrl: perspective.sharedUrl,
      members: [meta.author],
    },
    state,
  } as CommunityState;
}

export async function hydrateState() {
  const client = await getAd4mClient();
  const dataStore = useDataStore();
  const userStore = useUserStore();
  const perspectives = await client.perspective.all();
  const status = await client.agent.status();

  const profile = await getProfile(status.did!);

  userStore.setUserProfile(profile!);

  userStore.updateAgentStatus(status);

  const communities = dataStore.getCommunities.filter(
    (community) =>
      !perspectives.map((e) => e.uuid).includes(community.state.perspectiveUuid)
  );

  for (const community of communities) {
    dataStore.removeCommunity({ communityId: community.state.perspectiveUuid });

    dataStore.clearChannels({ communityId: community.state.perspectiveUuid });
  }

  for (const perspective of perspectives) {
    // ! Replaced this with querylinks because this returns the string literal and not the link itself
    // ! so deleting the link becomes difficult because the timestamp difference between the channel link & literal link
    // const channelLinks = await client.perspective.queryProlog(
    //   perspective.uuid,
    //   `triple("${SELF}", "${CHANNEL}", C).`
    // );
    const hasCommunityAlready = dataStore.getCommunities.find(
      (c) => c.state.perspectiveUuid === perspective.uuid
    );

    if (hasCommunityAlready) return;

    const channelLinks = await client.perspective.queryLinks(
      perspective.uuid,
      new LinkQuery({
        source: SELF,
        predicate: CHANNEL,
      })
    );

    if (perspective.sharedUrl !== undefined && perspective.neighbourhood) {
      const newCommunity = await buildCommunity(perspective);

      dataStore.addCommunity(newCommunity);

      const channels = [...Object.values(dataStore.channels)];

      const filteredChannels = dataStore
        .getChannelStates(perspective.uuid)
        .filter(
          (channel) =>
            !channelLinks.map((e) => e.data.target).includes(channel.id)
        );

      for (const c of filteredChannels) {
        dataStore.removeChannel({
          channelId: c.id,
        });
      }

      if (channelLinks) {
        for (const link of channelLinks) {
          try {
            const channel = link.data.target;
            const channelData = await Literal.fromUrl(channel).get();
            const exist = channels.find(
              (c: any) =>
                c.id === channel && c.sourcePerspective === perspective.uuid
            );
            if (!exist) {
              dataStore.addChannel({
                communityId: perspective.uuid,
                channel: {
                  id: channel,
                  name: channelData.data,
                  creatorDid: channelData.author,
                  sourcePerspective: perspective.uuid,
                  hasNewMessages: false,
                  createdAt: link.timestamp,
                  notifications: {
                    mute: false,
                  },
                },
              });
            }
          } catch (e) {
            console.error(
              "Got error when trying to hydrate community channel state",
              e
            );
          }
        }
      }
    }
  }
}
