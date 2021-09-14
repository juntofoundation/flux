import { print } from "graphql/language/printer";
import { GET_MANY_EXPRESSION, PERSPECTIVE_LINK_QUERY } from "@/core/graphql_queries";
import { LinkQuery } from "@perspect3vism/ad4m";
import { useDataStore } from "..";
import { useAppStore } from "@/store/app";
import { getManyExpression } from "@/core/queries/getExpression";

export interface Payload {
  channelId: string;
  from?: Date;
  to?: Date;
  expressionWorker: Worker;
}

export interface LoadExpressionResult {
  linksWorker: Worker;
  expressionWorker: Worker;
}

export default async function ({
  channelId,
  expressionWorker,
  from,
  to,
}: Payload): Promise<LoadExpressionResult> {
  const dataStore = useDataStore();
  const appStore = useAppStore();

  try {
    const channel = dataStore.getNeighbourhood(channelId);
    const fromDate = from || appStore.getApplicationStartTime;
    const untilDate = to || channel.createdAt!;

    if (!channel) {
      console.error(`No channel with id ${channelId} found`);
    }

    const linksWorker = new Worker("pollingWorker.js");
    //const expressionWorker = new Worker("pollingWorker.js");

    console.log("Posting for links between", fromDate, untilDate);
    linksWorker.postMessage({
      interval: 10000,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: channelId.toString(),
        query: {
          source: "sioc://chatchannel",
          predicate: "sioc://content_of",
          fromDate,
          untilDate,
        } as LinkQuery,
      },
      name: `Get desc expressionLinks for channel: ${channel.name}`,
      dataKey: "perspectiveQueryLinks",
    });

    console.log("Posting for links between", fromDate, new Date());
    linksWorker.postMessage({
      interval: 10000,
      staticSleep: true,
      query: print(PERSPECTIVE_LINK_QUERY),
      variables: {
        uuid: channelId.toString(),
        query: {
          source: "sioc://chatchannel",
          predicate: "sioc://content_of",
          fromDate,
          untilDate: new Date(),
        } as LinkQuery,
      },
      name: `Get forward expressionLinks for channel: ${channel.name}`,
      dataKey: "perspectiveQueryLinks",
    });

    //If links worker gets an error then throw it
    linksWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    //Listen for message callback saying we got some links
    linksWorker.addEventListener("message", async (e) => {
      const linkQuery = e.data.perspectiveQueryLinks;

      const links = linkQuery.filter((link: any) => {
        const currentExpressionLink =
        channel.currentExpressionLinks[link.data.target];
        const currentExpression =
        channel.currentExpressionMessages[link.data.target];

        return !currentExpressionLink || !currentExpression;
      });

      const linksHash = links.map((link: any) => link.data.target);

      if (links.length > 0) {
        //Run expression worker to try and get expression on link target        
        expressionWorker.postMessage({
          retry: 50,
          interval: 5000,
          query: print(GET_MANY_EXPRESSION),
          variables: { urls: linksHash },
          callbackData: { links },
          name: `Get expression data from channel links ${channel.name}`,
          dataKey: "expressionMany",
        });
      }
    });

    expressionWorker.onerror = function (e) {
      throw new Error(e.toString());
    };

    expressionWorker.addEventListener("message", (e: any) => {
      const expressionMany = e.data.expressionMany;
      const links = e.data.callbackData.links;

      //Add the link and message to the store
      dataStore.addMessages({
        channelId,
        links: links,
        expressions: expressionMany,
      });
    });

    return { linksWorker, expressionWorker };
  } catch (e) {
    appStore.showDangerToast({
      message: e.message,
    });
    throw new Error(e);
  }
}
