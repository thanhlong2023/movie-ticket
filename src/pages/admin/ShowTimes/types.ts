import type { Showtime, TheaterType, ScreenType, Movie } from "../../../types";

export type EnrichedShowtime = Showtime & {
    movie?: Movie;
    screen?: ScreenType;
    theater?: TheaterType;
};

// Group by region > theater > screen > showtimes
export interface GroupedByScreen {
    [region: string]: {
        theaters: {
            [theaterId: number]: {
                theater: TheaterType;
                screens: {
                    [screenId: number]: {
                        screen: ScreenType;
                        showtimes: EnrichedShowtime[];
                    };
                };
            };
        };
    };
}

export interface ShowTimeFormData {
    movieId: number;
    theaterId?: number;
    screenId?: number;
    startTime: string;
    endTime: string;
    price: number;
    priceVip: number;
    priceCouple: number;
}
