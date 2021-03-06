import { Pool } from 'pg';
import { orderedFor, slug } from '../util';

export default (pgPool: Pool) => {
  return {
    async getUsersByIds(userIds: string[]) {
      const response = await pgPool.query(
        `
            select * from users
            where id = ANY($1)`,
        [userIds],
      );

      return orderedFor(response.rows, userIds, 'id', true);
    },
    async getUsersByApiKeys(apiKeys: string[]) {
      const response = await pgPool.query(
        `
            select * from users
            where api_key = ANY($1)`,
        [apiKeys],
      );

      return orderedFor(response.rows, apiKeys, 'apiKey', true);
    },
    async getContestsForUserIds(userIds: string[]) {
      const response = await pgPool.query(
        `
      select * from contests
      where created_by = ANY($1)`,
        [userIds],
      );

      return orderedFor(response.rows, userIds, 'createdBy', false);
    },
    async getNamesForContestIds(contestIds: string[]) {
      const response = await pgPool.query(
        `
      select * from names
      where contest_id = ANY($1)`,
        [contestIds],
      );

      return orderedFor(response.rows, contestIds, 'contestId', false);
    },
    async getTotalVotesByNameIds(nameIds: string[]) {
      const response = await pgPool.query(
        `
      select name_id, up, down from total_votes_by_name
      where name_id = ANY($1)
      `,
        [nameIds],
      );

      return orderedFor(response.rows, nameIds, 'nameId', true);
    },
    async addNewContest({ apiKey, title, description }) {
      const response = pgPool.query(
        `
      insert into contests(code, title, description, created_by) 
      values ($1, $2, $3,
         (select id from users where api_key = $4))
        returning *`,
        [slug(title), title, description, apiKey],
      );

      return (await response).rows;
    },
    async getActivitiesForUserIds(userIds: string[]) {
      const response = await pgPool.query(
        `
      select created_by, created_at, label, '' as title,
          'name' as activity_type
      from names
      where created_by = ANY($1)
      union
      select created_by, created_at, '' as label, title,
          'contest' as activity_type
      from contests
      where created_by = ANY($1)
      `,
        [userIds],
      );

      return orderedFor(response.rows, userIds, 'createdBy', false);
    },
  };
};
