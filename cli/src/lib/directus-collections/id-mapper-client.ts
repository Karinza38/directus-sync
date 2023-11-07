
export type IdMap = {
    id: number;
    table: string;
    sync_id: string;
    local_id: string;
    created_at: Date;
};

export class IdMapperClient {

    protected readonly extensionUri = '/directus-extension-sync';

    constructor(protected readonly table: string) {}

    async getBySyncId(syncId: string): Promise<IdMap | undefined> {
        const data = await this.fetch<IdMap[]>(`/table/${this.table}/sync_id/${syncId}`)
            .catch((error) => {
                if (error.message === 'No id map found') {
                    return [];
                }
                throw error;
            });
        return data.length ? data[0] : undefined;
    }

    async getByLocalId(localId: string | number): Promise<IdMap | undefined> {
        const data = await this.fetch<IdMap[]>(`/table/${this.table}/local_id/${localId}`)
            .catch((error) => {
                if (error.message === 'No id map found') {
                    return [];
                }
                throw error;
            });
        return data.length ? data[0] : undefined;
    }

    async getAll(): Promise<IdMap[]> {
        return await this.fetch<IdMap[]>(`/table/${this.table}`);
    }

    async create(localId: string | number): Promise<string> {
        const data = await this.fetch<{ sync_id: string }>(`/table/${this.table}`, 'POST', {
            table: this.table,
            local_id: localId
        });
        return data.sync_id;
    }

    async removeBySyncId(syncId: string): Promise<void> {
        await this.fetch(`/table/${this.table}/sync_id/${syncId}`, 'DELETE');
    }

    async removeByLocalId(localId: string | number): Promise<void> {
        await this.fetch(`/table/${this.table}/local_id/${localId}`, 'DELETE');
    }

    protected async fetch<T>(
        uri: string,
        method: RequestInit['method'] = 'GET',
        payload: any = undefined,
        options: RequestInit = {}
    ): Promise<T> {
        const {DIRECTUS_URL, DIRECTUS_TOKEN} = process.env;
        if (!DIRECTUS_URL) {
            throw new Error('Missing Directus URL');
        }
        if (!DIRECTUS_TOKEN) {
            throw new Error('Missing Directus Token');
        }
        const response = await fetch(`${DIRECTUS_URL}${this.extensionUri}${uri}`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.DIRECTUS_TOKEN}`
            },
            method,
            body: payload ? JSON.stringify(payload) : null,
            ...options
        });
        if (!response.ok) {
            throw new Error(await response.text());
        } else {
            return await response.json() as T;
        }
    }
}
