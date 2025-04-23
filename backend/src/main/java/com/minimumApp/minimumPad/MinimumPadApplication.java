package com.minimumApp.minimumPad;

import org.socialsignin.spring.data.dynamodb.repository.config.EnableDynamoDBRepositories;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;
//import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@SpringBootApplication(scanBasePackages = "com.minimumApp.minimumPad")
@EnableDynamoDBRepositories(basePackages = "com.minimumApp.minimumPad.repository")
public class MinimumPadApplication extends SpringBootServletInitializer {

	public static void main(String[] args) {
		SpringApplication.run(MinimumPadApplication.class, args);
		System.out.println("Up and Running!");
	}

	@Override
	protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
		return builder.sources(MinimumPadApplication.class);
	}




}
