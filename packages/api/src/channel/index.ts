import { community } from "@fluxapp/constants";
import { EntryType } from "@fluxapp/types";
import {
  subjectProperty,
  subjectCollection,
  SDNAClass,
  subjectFlag,
} from "@perspect3vism/ad4m";
import App from "../app";

const { FLUX_APP, NAME, ENTRY_TYPE } = community;

@SDNAClass({
  name: "Channel",
})
export class Channel {
  @subjectFlag({
    through: ENTRY_TYPE,
    value: EntryType.Channel,
  })
  type: string;

  @subjectProperty({
    through: NAME,
    writable: true,
    resolveLanguage: "literal",
  })
  name: string;

  @subjectCollection({
    through: FLUX_APP,
    where: { isInstance: App },
  })
  views: string[] = [];
}

export default Channel;