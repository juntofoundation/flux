import { SDNAClass, SubjectEntity, SubjectFlag, SubjectProperty } from "@coasys/ad4m";
import { languages } from "@coasys/flux-constants";
const { EMBEDDING_VECTOR_LANGUAGE } = languages;

@SDNAClass({
  name: "Embedding",
})
export default class Embedding extends SubjectEntity {
  @SubjectFlag({
    through: "flux://entry_type",
    value: "flux://has_embedding",
  })
  type: string;

  @SubjectProperty({
    through: "flux://embedding",
    writable: true,
  })
  embedding: any;

  @SubjectProperty({
    through: "flux://model",
    writable: true,
    resolveLanguage: "literal",
  })
  model: string;
}
