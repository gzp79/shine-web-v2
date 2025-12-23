import z from 'zod';
import { getCurrentUserMock, selectUserMock } from '@mocks/data/user';

export const MockSettingSchema = z.object({
    user: z.string()
});
export type MockSetting = z.infer<typeof MockSettingSchema>;
export type PatchMockSetting = Partial<MockSetting>;

export function applyMock(mocks: PatchMockSetting) {
    if (mocks.user) {
        selectUserMock(mocks.user);
    }
}

export function getCurrentMock(): MockSetting {
    return {
        user: getCurrentUserMock()
    };
}
