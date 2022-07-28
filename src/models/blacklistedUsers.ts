import { model, Schema } from 'mongoose';

import { BlacklistedTypes } from '../TS/interfaces';

const blacklistedUser: Schema = new Schema({
	userID: { type: String },
});

export = model<BlacklistedTypes>('blacklisted', blacklistedUser);
