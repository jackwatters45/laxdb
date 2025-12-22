import {
  RiDropFill,
  RiNavigationFill,
  RiPieChartFill,
  RiRobot3Fill,
} from '@remixicon/react';
import { Divider } from '../divider';
import AnalyticsIllustration from './analytics-illustration';
import { StickerCard } from './sticker-card';

export function SolarAnalytics() {
  return (
    <section
      aria-labelledby="solar-analytics"
      className="relative mx-auto w-full max-w-6xl overflow-hidden"
    >
      <div>
        <h2
          className="relative scroll-my-24 text-lg font-semibold tracking-tight text-orange-500"
          id="solar-analytics"
        >
          Solar Analytics
          <div className="absolute top-1 -left-[8px] h-5 w-[3px] rounded-r-sm bg-orange-500" />
        </h2>
        <p className="mt-2 max-w-lg text-3xl font-semibold tracking-tighter text-balance text-gray-900 md:text-4xl">
          Turn field data into profitable harvests with real-time insights
        </p>
      </div>
      <div className="*:pointer-events-none">
        <AnalyticsIllustration />
      </div>
      <Divider className="mt-0" />
      <div className="grid grid-cols-1 grid-rows-2 gap-6 md:grid-cols-4 md:grid-rows-1">
        <StickerCard
          description="Smart tractors that navigate fields independently using GPS."
          Icon={RiNavigationFill}
          title="Autonomous Navigation"
        />
        <StickerCard
          description="AI-powered robots that identify and harvest crops at optimal ripeness."
          Icon={RiRobot3Fill}
          title="Robotic Harvesting"
        />
        <StickerCard
          description="Automated irrigation systems that optimize water usage."
          Icon={RiDropFill}
          title="Smart Irrigation"
        />
        <StickerCard
          description="Advanced analytics platform that predicts crop yields."
          Icon={RiPieChartFill}
          title="Yield Analytics"
        />
      </div>
    </section>
  );
}
