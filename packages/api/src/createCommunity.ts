import { v4 as uuidv4 } from "uuid";
import { Community as FluxCommunity } from "@coasys/flux-types";
import { Ad4mClient, Perspective } from "@coasys/ad4m";
import { getAd4mClient } from "@coasys/ad4m-connect/utils";
import {
  blobToDataURL,
  dataURItoBlob,
  resizeImage,
  createNeighbourhoodMeta,
} from "@coasys/flux-utils";
import { SubjectRepository } from "./factory";
import { Community } from "./community";

export interface Payload {
  linkLangAddress?: string;
  name: string;
  image?: string;
  description?: string;
  perspectiveUuid?: string;
}

export default async function createCommunity({
  linkLangAddress,
  name,
  description = "",
  image = undefined,
  perspectiveUuid,
}: Payload): Promise<FluxCommunity> {
  try {
    const client: Ad4mClient = await getAd4mClient();
    const agent = await client.agent.me();

    const author = agent.did;

    const perspective = perspectiveUuid
      ? await client.perspective.byUUID(perspectiveUuid)
      : await client.perspective.add(name);

    //Create metadata
    const metaLinks = await createNeighbourhoodMeta(name, description, author);

    const CommunityModel = new SubjectRepository(Community, {
      perspective: perspective,
    });

    let thumbnail: string | undefined = undefined;
    let compressedImage: string | undefined = undefined;

    if (image) {
      compressedImage = await blobToDataURL(
        await resizeImage(dataURItoBlob(image as string), 0.6)
      );
      thumbnail = await blobToDataURL(
        await resizeImage(dataURItoBlob(image as string), 0.3)
      );
    }

    const metaData = {
      name,
      description,
      image: compressedImage
        ? {
            data_base64: compressedImage,
            name: "community-image",
            file_type: "image/png",
          }
        : undefined,
      thumbnail: thumbnail
        ? {
            data_base64: thumbnail,
            name: "community-image",
            file_type: "image/png",
          }
        : undefined,
    };

    const uid = uuidv4().toString();

    const langs = await client.runtime.knownLinkLanguageTemplates();

    //Create unique social-context
    const linkLanguage = await client.languages.applyTemplateAndPublish(
      linkLangAddress || langs[0],
      JSON.stringify({
        uid: uid,
        name: `${name}-link-language`,
      })
    );

    let sharedUrl = perspective!.sharedUrl;

    if (!sharedUrl) {
      sharedUrl = await client.neighbourhood.publishFromPerspective(
        perspective!.uuid,
        linkLanguage.address,
        new Perspective(metaLinks)
      );
    }

    const community = await CommunityModel.create(metaData, "ad4m://self");

    const notifications = await client.runtime.notifications();

    const notification = notifications.find(notification => notification.appName === "Flux")

    const notificationId = notification.id
    delete notification.granted
    delete notification.id

    await client.runtime.updateNotification(notificationId, {
      ...notification,
      perspectiveIds: [...notification.perspectiveIds, perspective.uuid]
    })

    // @ts-ignore
    return {
      uuid: perspective.uuid,
      author: author,
      id: community.id,
      timestamp: community.timestamp,
      name: community.name,
      description: community.description || "",
      image: community.image,
      thumbnail: community.thumbnail,
      neighbourhoodUrl: sharedUrl,
      members: [author],
    };
  } catch (e) {
    throw new Error(e);
  }
}
