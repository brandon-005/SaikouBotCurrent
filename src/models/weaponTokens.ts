import { model, Schema } from 'mongoose';

import { TokensTypes } from '../TS/interfaces';

const tokensUser: Schema = new Schema({
	userID: { type: String },
	tokens: { type: Number },
});

export = model<TokensTypes>('weaponTokens', tokensUser);
