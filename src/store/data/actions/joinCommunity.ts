import { createProfile } from "@/core/methods/createProfile";
import { createLink } from "@/core/mutations/createLink";
import { joinNeighbourhood } from "@/core/mutations/joinNeighbourhood";
import { getTypedExpressionLanguages } from "@/core/methods/getTypedExpressionLangs";
import { findNameFromMeta } from "@/core/methods/findNameFromMeta";
import { getPerspectiveSnapshot } from "@/core/queries/getPerspective";

import { Link } from "@perspect3vism/ad4m-types";

import { rootActionContext, rootGetterContext } from "@/store/index";
import { ExpressionTypes, CommunityState, MembraneType } from "@/store/types";

export interface Payload {
  joiningLink: string;
}

export default async (
  context: any,
  { joiningLink }: Payload
): Promise<void> => {
  const { getters } = rootGetterContext(context);
  const { commit, state } = rootActionContext(context);
  try {
    const neighbourhoods = state.data.neighbourhoods;
    const isAlreadyPartOf = Object.values(neighbourhoods).find(
      (c) => c.neighbourhoodUrl === joiningLink
    );
    if (!isAlreadyPartOf) {
      const neighbourhood = await joinNeighbourhood(joiningLink);
      console.log(
        new Date(),
        "Installed neighbourhood with result",
        neighbourhood
      );

      const perspective = await getPerspectiveSnapshot(neighbourhood.uuid);

      //Get and cache the expression UI for each expression language
      //And used returned expression language names to populate typedExpressionLanguages field
      const [typedExpressionLanguages, uiIcons] =
        await getTypedExpressionLanguages(perspective!, true);

      for (const uiIcon of uiIcons) {
        commit.addExpressionUI(uiIcon);
      };

      const profileExpLang = typedExpressionLanguages.find(
        (val) => val.expressionType == ExpressionTypes.ProfileExpression
      );
      if (profileExpLang != undefined) {
        const profile = getters.getProfile;

        const createProfileExpression = await createProfile(
          profileExpLang.languageAddress!,
          profile!.username,
          profile!.email,
          profile!.givenName,
          profile!.familyName,
          profile!.profilePicture,
          profile!.thumbnailPicture
        );

        //Create link between perspective and group expression
        const addProfileLink = await createLink(neighbourhood.uuid, {
          source: `${neighbourhood.uuid}://self`,
          target: createProfileExpression,
          predicate: "sioc://has_member",
        } as Link);
        console.log("Created group expression link", addProfileLink);
      }

      //Read out metadata about the perspective from the meta
      const name = findNameFromMeta(perspective!);

      const newCommunity = {
        neighbourhood: {
          name: name,
          description: "",
          perspective: neighbourhood,
          typedExpressionLanguages: typedExpressionLanguages,
          groupExpressionRef: "na",
          neighbourhoodUrl: joiningLink,
          membraneType: MembraneType.Unique,
          linkedNeighbourhoods: [],
          linkedPerspectives: [],
          members: [],
          currentChannelId: null,
          currentExpressionLinks: {},
          currentExpressionMessages: {},
        },
        state: {
          perspectiveUuid: neighbourhood.uuid,
          theme: {
            fontSize: "md",
            fontFamily: "default",
            name: "light",
            hue: 270,
            saturation: 60,
          },
          channels: {},
          currentChannelId: null,
        },
      } as CommunityState;

      commit.addCommunity(newCommunity);
    } else {
      const message = "You are already part of this group";

      commit.showDangerToast({
        message,
      });
    }
  } catch (e) {
    commit.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
};
