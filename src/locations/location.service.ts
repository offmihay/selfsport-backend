import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom, of } from 'rxjs';
import { AxiosError } from 'axios';

type Location = {
  lat: number;
  lng: number;
};

type IpApiResponse = {
  ip: string;
  latitude: number;
  longitude: number;
} & Record<string, any>;

const cachedLocations: Map<string, Location> = new Map();

export const getCachedLocation = async (ip: string) => {
  if (cachedLocations.has(ip)) {
    return cachedLocations.get(ip);
  }
};

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly ipApiUrl: string;
  private readonly ipApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ipApiUrl = this.configService.get<string>('IPAPI_URL')!;
    this.ipApiKey = this.configService.get<string>('IPAPI_KEY')!;
  }

  async getCoordsAPI(ip?: string): Promise<Location | undefined> {
    const url = `${this.ipApiUrl}/ipgeo?apiKey=${this.ipApiKey}&ip=${ip}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<IpApiResponse>(url).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.response?.data);
            return of(undefined);
          }),
        ),
      );

      if (
        !response ||
        response.data.latitude === undefined ||
        response.data.longitude === undefined
      ) {
        this.logger.warn(`No data received for IP: ${ip}`);
        return undefined;
      }

      return { lat: response.data.latitude, lng: response.data.longitude };
    } catch (error) {
      this.logger.error(
        `Unexpected error while fetching IP data: ${error.message}`,
      );
      return undefined;
    }
  }

  async getLocationByIp(ip: string): Promise<Location | undefined> {
    if (cachedLocations.has(ip)) {
      return cachedLocations.get(ip);
    }
    const location = await this.getCoordsAPI(ip);
    if (location) {
      cachedLocations.set(ip, location);
      return location;
    }
  }
}
