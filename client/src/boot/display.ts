import { Race } from '@app/shared/enums/race.enum';
import { boot } from 'quasar/wrappers';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $display: Display;
  }
}

class Display {
	readonly races: { [k: string]: string } = {
		[Race.HYUR]: 'Hyur',
		[Race.ELEZEN]: 'Elezen',
		[Race.LALAFELL]: 'Lalafell',
		[Race.MIQOTE]: "Miqo'te",
		[Race.ROEGADYN]: 'Roegadyn',
		[Race.AURA]: 'Au Ra',
		[Race.HROTHGAR]: 'Hhothgar',
		[Race.VIERA]: 'Viera'
	};
}

export default boot(({ app }) => {
  app.config.globalProperties.$display = new Display();
});