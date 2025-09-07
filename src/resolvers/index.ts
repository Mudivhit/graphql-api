import OpenMeteoService from '../services/openmeteoService';

export default class Resolvers {
    private readonly openMeteoService: OpenMeteoService;

    constructor() {
        this.openMeteoService = new OpenMeteoService();
    }

    getResolvers() {
        return {
            Query: {
                searchCities: async (_: unknown, { query, limit }: { query: string; limit: number }) => {
                    if (!query || query.trim().length < 2) {
                        throw new Error('Search query must be at least 2 characters long');
                    }
                    const cities = await this.openMeteoService.searchCities(query.trim(), limit);
                    return cities;
                },
            },
        };
    }
}
