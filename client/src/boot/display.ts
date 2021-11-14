import { ImageCategory } from '@app/shared/enums/image-category.enum';
import { Race } from '@app/shared/enums/race.enum';
import { StoryType } from '@app/shared/enums/story-type.enum';
import SharedConstants from '@app/shared/SharedConstants';
import { DateTime, DateTimeFormatOptions } from 'luxon';
import { boot } from 'quasar/wrappers';

// This boot file adds a $display property to all Vue components, containing human-readable display names
// for constants used in the code.

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $display: Display;
  }
}

const BASIC_DATE_FORMAT_OPTIONS: DateTimeFormatOptions = Object.freeze({
  dateStyle: 'long',
  timeStyle: 'short',
});

class Display {
	readonly races: { [k: string]: string } = {
		[Race.HYUR]: 'Hyur',
		[Race.ELEZEN]: 'Elezen',
		[Race.LALAFELL]: 'Lalafell',
		[Race.MIQOTE]: "Miqo'te",
		[Race.ROEGADYN]: 'Roegadyn',
		[Race.AURA]: 'Au Ra',
		[Race.HROTHGAR]: 'Hhothgar',
		[Race.VIERA]: 'Viera',
	};

	readonly storyTypes: { [k: string]: string } = {
		[StoryType.PUBLISHED_WORK]: 'Published Work',
		[StoryType.DIARY]: 'Diary',
		[StoryType.POETRY]: 'Poetry',
		[StoryType.IC_HAPPENING]: 'IC Happening',
		[StoryType.CONCEPTUAL]: 'Conceptual',
	};

	readonly imageCategories: { [k: string]: string } = {
		[ImageCategory.UNLISTED]: 'Unlisted',
		[ImageCategory.ARTWORK]: 'Artwork',
		[ImageCategory.SCREENSHOT]: 'Screenshot',
	};

	relativeTime(timestamp: number) {
		const result = DateTime.fromMillis(timestamp).toRelative({
			locale: 'en',
			unit: [ 'years', 'months', 'days', 'hours', 'minutes' ]
		}) || '';

		return result === '0 minutes ago' ? 'Just now' : result;
	}

	formatDate(timestamp: number) {
		return DateTime.fromMillis(timestamp).toLocaleString({
			dateStyle: 'long',
		}, { locale: 'en-GB' });
	}

	formatDateTimeServer(timestamp: number) {
		return DateTime.fromMillis(timestamp).toLocaleString(
        Object.assign(
          {
            timeZone: SharedConstants.FFXIV_SERVER_TIMEZONE,
          },
          BASIC_DATE_FORMAT_OPTIONS
        ), { locale: 'en-GB' }
      ) + ' ST';
	}

	formatDateTimeLocal(timestamp: number) {
		return DateTime.fromMillis(timestamp).toLocaleString(BASIC_DATE_FORMAT_OPTIONS, { locale: 'en-GB' }) + ' LT';
	}

	formatFileSize(fileSize: number) {
		if (fileSize < 1024) {
			return `${fileSize} bytes`;
		} else if (fileSize < 1024 * 1024) {
			const sizeKiB = Math.round(fileSize / 1024);
			return `${sizeKiB} KiB`;
		} else {
			const sizeMiB = fileSize / (1024 * 1024);
			const sizeMiBDisplay = Math.round(sizeMiB * 100) / 100; // 2 decimal digits
			return `${sizeMiBDisplay} MiB`;
		}
	}
}

export const displayOptions = new Display();

export default boot(({ app }) => {
  app.config.globalProperties.$display = displayOptions;
});
