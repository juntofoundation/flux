import { useDataStore } from "..";
import { SubjectRepository } from "utils/factory";
import { Member as MemberModel } from "utils/api";
import { useUserStore } from "@/store/user";
import { Factory, SubjectEntry } from "utils/helpers";
import { getAd4mClient } from "@perspect3vism/ad4m-connect/dist/utils";

export default async function (id: string): Promise<void> {
  const dataStore = useDataStore();
  const userStore = useUserStore();

  let ad4m = await getAd4mClient()
  let perspective = await ad4m.perspective.byUUID(id)
  const Member = new SubjectRepository(MemberModel, { 
    perspectiveUuid: id,
  });
  const members = await Member.getAll();

  const dids = await Promise.all(members.map(async (m) => {
    //@ts-ignore
    const channelEntry = new SubjectEntry<ChannelModel>(m, perspective);
    await channelEntry.load();

    return await channelEntry.author;
  }));


  dataStore.setNeighbourhoodMembers({
    members: dids.length === 0 ? [userStore.agent.did!] : dids,
    perspectiveUuid: id,
  });
}
