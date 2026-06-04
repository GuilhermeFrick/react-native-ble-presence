FROM reactnativecommunity/react-native-android:latest

WORKDIR /workspace

ENV CI=true

COPY package.json package-lock.json* ./
COPY packages ./packages
COPY examples ./examples
COPY tsconfig.base.json ./

RUN npm install

CMD ["npm", "run", "typecheck"]

