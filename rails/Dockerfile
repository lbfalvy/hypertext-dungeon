FROM ruby:3.0.2
RUN apt-get update -qq && \
    apt-get install -y \
    nodejs npm iproute2
RUN npm install --global yarn
WORKDIR /app
COPY rails/Gemfile /app/Gemfile
COPY rails/Gemfile.lock /app/Gemfile.lock
RUN gem install bundler
#  -v '~>1'
RUN bundle install
COPY rails/entrypoint.sh /usr/bin/
RUN chmod +x /usr/bin/entrypoint.sh
ENTRYPOINT ["entrypoint.sh"]
EXPOSE 80
EXPOSE 443

CMD ["rails", "server", "-b", "0.0.0.0"]
