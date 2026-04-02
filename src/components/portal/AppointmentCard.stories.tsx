import type { Meta, StoryObj } from '@storybook/react';
import AppointmentCard, { type PortalAppointment } from './AppointmentCard';

const meta: Meta<typeof AppointmentCard> = {
  title: 'Portal/AppointmentCard',
  component: AppointmentCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="max-w-md p-6"><Story /></div>],
  argTypes: {
    variant: { control: 'select', options: ['upcoming', 'past'] },
  },
};
export default meta;
type Story = StoryObj<typeof AppointmentCard>;

const upcomingAppointment: PortalAppointment = {
  id: '1',
  service: 'HydraFacial Signature',
  provider: 'Dr. Mom',
  date: '2026-04-10',
  time: '2:00 PM',
  duration: 60,
  status: 'Confirmed',
  location: '401 Olympia Ave NE, Suite 101, Renton, WA',
};

const pastAppointment: PortalAppointment = {
  id: '2',
  service: 'Sofwave Skin Tightening',
  provider: 'Dr. Mom',
  date: '2026-02-15',
  time: '10:00 AM',
  duration: 90,
  status: 'Completed',
  notes: 'Excellent results. Follow-up recommended in 6 weeks for optimal outcome.',
};

export const Upcoming: Story = {
  args: {
    appointment: upcomingAppointment,
    variant: 'upcoming',
  },
};

export const Past: Story = {
  args: {
    appointment: pastAppointment,
    variant: 'past',
    onRebook: () => {},
  },
};

export const PastWithoutNotes: Story = {
  args: {
    appointment: { ...pastAppointment, notes: undefined },
    variant: 'past',
    onRebook: () => {},
  },
};

export const UpcomingWithoutLocation: Story = {
  args: {
    appointment: { ...upcomingAppointment, location: undefined },
    variant: 'upcoming',
  },
};
