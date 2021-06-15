import { getExpression } from "@/core/queries/getExpression";
import { Profile } from "@/store";

export function toProfile(did: string, obj: { [x: string]: any }): Profile {
  const profile: Profile = {
    username: obj["foaf:AccountName"],
    email: obj["schema:email"],
    familyName: obj["schema:familyName"],
    givenName: obj["schema:givenName"],
    thumbnailPicture: undefined,
    profilePicture: undefined,
    address: did,
  };

  if (obj["schema:image"]) {
    profile.profilePicture = obj["schema:image"]["schema:contentUrl"];
    profile.thumbnailPicture =
      obj["schema:image"]["schema:thumbnail"]["schema:contentUrl"];
  }

  return profile;
}

export async function getProfile(
  profileLangAddress: string,
  did: string
): Promise<any> {
  const profileLink = `${profileLangAddress}://${did}`;

  const profileExp = await getExpression(profileLink);

  console.log({ profileExp, profileLink });

  const profile = profileExp;

  profile['data'] = JSON.parse(profileExp["data"]!).profile;

  if ((profile.data as any)!["schema:image"]) {
    (profile.data as any)!["schema:image"] = JSON.parse((profile.data as any)!["schema:image"]);
  }
  

  return profile;
}
