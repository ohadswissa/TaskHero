import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// User type is available from @prisma/client when needed for full user object
export interface CurrentUserPayload {
  userId: string;
  email: string | null;
  role: string;
  familyId: string;
}

export const CurrentUser = createParamDecorator(
  (
    data: keyof CurrentUserPayload | undefined,
    ctx: ExecutionContext,
  ): CurrentUserPayload | CurrentUserPayload[keyof CurrentUserPayload] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
