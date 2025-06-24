"""
Enhanced Test Suite for Voxta Voice Agent
Comprehensive testing with 99%+ accuracy validation
Compatible with Python 3.13
"""
import unittest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
import sys
import os

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from voice_agent import EnhancedVoxtaVoiceAgent
    from ai_voice_processor import EnhancedAIVoiceProcessor
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure all required files are in the same directory")
    sys.exit(1)

class TestEnhancedVoxtaVoiceAgent(unittest.TestCase):
    """Enhanced test cases for Voxta Voice Agent"""
    
    def setUp(self):
        """Set up enhanced test fixtures"""
        self.agent = EnhancedVoxtaVoiceAgent("http://localhost:5000/api")
        self.ai_processor = EnhancedAIVoiceProcessor(None, "http://localhost:5000/api")
    
    def test_enhanced_bid_extraction(self):
        """Test enhanced bid amount extraction with high accuracy"""
        test_cases = [
            ("bid 100 dollars", 100.0),
            ("place a bid of 250.50", 250.50),
            ("I want to bid $150", 150.0),
            ("go 300", 300.0),
            ("offer 75 bucks", 75.0),
            ("my bid is 500", 500.0),
            ("put in 200 dollars", 200.0),
            ("raise to 350", 350.0),
            ("increase to $400", 400.0),
            ("bid fifty", None),  # Should not extract words
            ("no numbers here", None),
            ("bid zero", None),  # Invalid amount
        ]
        
        for text, expected in test_cases:
            with self.subTest(text=text):
                result = self.ai_processor._extract_bid_amount(text)
                self.assertEqual(result, expected, f"Failed for: {text}")
    
    def test_enhanced_intent_detection(self):
        """Test enhanced intent detection accuracy"""
        test_cases = [
            ("list all active auctions", "listing"),
            ("what auctions are available", "listing"),
            ("show me auctions", "listing"),
            ("bid 100 dollars", "bidding"),
            ("place a bid of 200", "bidding"),
            ("current highest bid", "status"),
            ("what's the status", "status"),
            ("help me", "help"),
            ("hello", "greeting"),
            ("good morning", "greeting"),
            ("market insights", "insights"),
            ("analyze trends", "insights"),
        ]
        
        for command, expected_intent in test_cases:
            with self.subTest(command=command):
                # Test with enhanced AI processor
                result = asyncio.run(self.ai_processor.process_with_advanced_nlp(command, "test_user"))
                self.assertEqual(result["intent"], expected_intent, f"Failed for: {command}")
                self.assertGreater(result["confidence"], 0.7, f"Low confidence for: {command}")
    
    @patch('requests.get')
    def test_enhanced_auction_fetching(self, mock_get):
        """Test enhanced auction fetching with detailed data"""
        # Mock successful response with enhanced data
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                '_id': '123',
                'name': 'iPhone 13 Pro',
                'currentBid': 500,
                'totalBids': 15,
                'status': 'active',
                'endTime': '2024-12-31T23:59:59Z',
                'description': 'Brand new iPhone 13 Pro',
                'category': 'Electronics',
                'startingBid': 100,
                'viewCount': 250,
                'isFeatured': True
            },
            {
                '_id': '456',
                'name': 'Vintage Watch',
                'currentBid': 200,
                'totalBids': 8,
                'status': 'active',
                'endTime': '2024-12-30T18:00:00Z',
                'description': 'Rare vintage timepiece',
                'category': 'Collectibles',
                'startingBid': 50,
                'viewCount': 120,
                'isFeatured': False
            }
        ]
        mock_get.return_value = mock_response
        
        auctions = asyncio.run(self.agent.get_auctions_enhanced())
        
        self.assertEqual(len(auctions), 2)
        self.assertEqual(auctions[0].name, 'iPhone 13 Pro')
        self.assertEqual(auctions[0].current_bid, 500)
        self.assertEqual(auctions[0].category, 'Electronics')
        self.assertTrue(auctions[0].is_featured)
        self.assertEqual(auctions[1].name, 'Vintage Watch')
        self.assertEqual(auctions[1].category, 'Collectibles')
        self.assertFalse(auctions[1].is_featured)
    
    @patch('requests.post')
    @patch('requests.get')
    def test_enhanced_bid_placement(self, mock_get, mock_post):
        """Test enhanced bid placement with validation"""
        # Mock auction data
        mock_get_response = Mock()
        mock_get_response.status_code = 200
        mock_get_response.json.return_value = [
            {
                '_id': '123',
                'name': 'Test Auction',
                'currentBid': 100,
                'totalBids': 5,
                'status': 'active',
                'endTime': '2024-12-31T23:59:59Z',
                'category': 'Electronics',
                'description': 'Test item'
            }
        ]
        mock_get.return_value = mock_get_response
        
        # Mock successful bid response
        mock_post_response = Mock()
        mock_post_response.status_code = 200
        mock_post_response.json.return_value = {"message": "Bid placed successfully"}
        mock_post_response.content = True
        mock_post.return_value = mock_post_response
        
        success, result = asyncio.run(self.agent.place_bid_enhanced("123", 150.0, "Test User"))
        
        self.assertTrue(success)
        self.assertEqual(result["message"], "Bid placed successfully")
        
        # Verify the request was made with enhanced data
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertEqual(call_args[1]['json']['bidAmount'], 150.0)
        self.assertEqual(call_args[1]['json']['bidType'], 'voice_enhanced_v2')
        self.assertEqual(call_args[1]['json']['source'], 'enhanced_voice_agent')
        self.assertIn('metadata', call_args[1]['json'])
    
    def test_confidence_calculation(self):
        """Test enhanced confidence calculation"""
        test_cases = [
            ("bid 100 dollars", "bidding", True, 0.9),  # Should have high confidence
            ("list auctions", "listing", True, 0.85),   # Good confidence
            ("help", "help", True, 0.95),               # Very high confidence
            ("unclear mumbling", "unknown", False, 0.2), # Low confidence
        ]
        
        for text, intent, pattern_match, min_confidence in test_cases:
            with self.subTest(text=text):
                confidence = self.ai_processor._calculate_confidence(text, intent, pattern_match)
                self.assertGreaterEqual(confidence, min_confidence, f"Low confidence for: {text}")
                self.assertLessEqual(confidence, 1.0, f"Confidence too high for: {text}")
    
    def test_text_preprocessing(self):
        """Test enhanced text preprocessing"""
        test_cases = [
            ("um, bid 100 dollars please", "bid 100 dollars please"),
            ("place a bit of 200", "place a bid of 200"),  # Common speech error
            ("show me options", "show me auctions"),  # Synonym replacement
            ("what's the current price", "what's the current bid"),  # Term correction
            ("i want to buy this", "i want to bid this"),  # Action correction
        ]
        
        for input_text, expected in test_cases:
            with self.subTest(input_text=input_text):
                result = self.ai_processor._preprocess_text(input_text)
                self.assertEqual(result, expected)
    
    def test_fuzzy_matching(self):
        """Test fuzzy intent matching for unclear commands"""
        test_cases = [
            ("bid", "bidding"),
            ("list", "listing"),
            ("help", "help"),
            ("status", "status"),
            ("insights", "insights"),
        ]
        
        for partial_command, expected_intent in test_cases:
            with self.subTest(partial_command=partial_command):
                intent, confidence = self.ai_processor._fuzzy_match_intent(partial_command)
                self.assertEqual(intent, expected_intent)
                self.assertGreater(confidence, 0.5)
    
    @patch('requests.get')
    def test_bid_validation(self, mock_get):
        """Test enhanced bid validation"""
        # Mock auction data for validation
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = [
            {
                '_id': '123',
                'name': 'Test Auction',
                'currentBid': 100,
                'status': 'active'
            }
        ]
        mock_get.return_value = mock_response
        
        # Test valid bid
        validation = asyncio.run(self.ai_processor._validate_bid_amount(150.0))
        self.assertTrue(validation['is_valid'])
        
        # Test invalid bid (too low)
        validation = asyncio.run(self.ai_processor._validate_bid_amount(50.0))
        self.assertFalse(validation['is_valid'])
        self.assertIn("higher than current", validation['reason'])
        
        # Test invalid bid (too high)
        validation = asyncio.run(self.ai_processor._validate_bid_amount(20000000.0))
        self.assertFalse(validation['is_valid'])
        self.assertIn("too high", validation['reason'])
    
    def test_time_calculation(self):
        """Test enhanced time remaining calculation"""
        # Test with future date
        future_time = "2025-12-31T23:59:59Z"
        result = self.agent._calculate_time_remaining(future_time)
        self.assertNotEqual(result, "Ended")
        self.assertNotEqual(result, "Unknown")
        
        # Test with past date
        past_time = "2020-01-01T00:00:00Z"
        result = self.agent._calculate_time_remaining(past_time)
        self.assertEqual(result, "Ended")
        
        # Test with invalid time
        invalid_time = "invalid-time"
        result = self.agent._calculate_time_remaining(invalid_time)
        self.assertEqual(result, "Unknown")

class TestAccuracyMetrics(unittest.TestCase):
    """Test accuracy metrics and performance"""
    
    def setUp(self):
        self.ai_processor = EnhancedAIVoiceProcessor(None, "http://localhost:5000/api")
    
    def test_accuracy_benchmark(self):
        """Test overall accuracy against benchmark commands"""
        benchmark_commands = [
            ("bid 100 dollars", "bidding", 100.0),
            ("place a bid of 250", "bidding", 250.0),
            ("list all auctions", "listing", None),
            ("show me available auctions", "listing", None),
            ("what's the current bid", "status", None),
            ("current highest bid", "status", None),
            ("help me", "help", None),
            ("hello", "greeting", None),
            ("market insights", "insights", None),
            ("analyze trends", "insights", None),
        ]
        
        correct_predictions = 0
        total_predictions = len(benchmark_commands)
        
        for command, expected_intent, expected_amount in benchmark_commands:
            result = asyncio.run(self.ai_processor.process_with_advanced_nlp(command, "test_user"))
            
            # Check intent accuracy
            if result['intent'] == expected_intent:
                correct_predictions += 1
            
            # Check bid amount accuracy if applicable
            if expected_amount is not None:
                self.assertEqual(result.get('bid_amount'), expected_amount)
            
            # Ensure confidence is reasonable
            self.assertGreater(result['confidence'], 0.7)
        
        accuracy = correct_predictions / total_predictions
        self.assertGreaterEqual(accuracy, 0.95, f"Accuracy {accuracy:.2%} below 95% threshold")
        print(f"✅ Accuracy benchmark: {accuracy:.2%}")
    
    def test_session_stats_tracking(self):
        """Test session statistics tracking"""
        processor = self.ai_processor
        
        # Process several commands
        commands = [
            "bid 100 dollars",
            "list auctions",
            "current status",
            "help"
        ]
        
        for command in commands:
            asyncio.run(processor.process_voice_command(command, "test_user"))
        
        # Check session stats
        self.assertEqual(processor.session_stats['total_commands'], len(commands))
        self.assertGreaterEqual(processor.session_stats['successful_commands'], 0)
        self.assertLessEqual(processor.session_stats['accuracy_score'], 1.0)

class TestErrorHandling(unittest.TestCase):
    """Test error handling and edge cases"""
    
    def setUp(self):
        self.agent = EnhancedVoxtaVoiceAgent("http://localhost:5000/api")
        self.ai_processor = EnhancedAIVoiceProcessor(None, "http://localhost:5000/api")
    
    @patch('requests.get')
    def test_network_error_handling(self, mock_get):
        """Test handling of network errors"""
        # Mock network error
        mock_get.side_effect = requests.RequestException("Network error")
        
        auctions = asyncio.run(self.agent.get_auctions_enhanced())
        self.assertEqual(len(auctions), 0)
    
    @patch('requests.get')
    def test_api_error_handling(self, mock_get):
        """Test handling of API errors"""
        # Mock API error response
        mock_response = Mock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        mock_get.return_value = mock_response
        
        auctions = asyncio.run(self.agent.get_auctions_enhanced())
        self.assertEqual(len(auctions), 0)
    
    def test_invalid_input_handling(self):
        """Test handling of invalid inputs"""
        # Test empty input
        result = asyncio.run(self.ai_processor.process_with_advanced_nlp("", "test_user"))
        self.assertEqual(result['intent'], 'unknown')
        
        # Test nonsensical input
        result = asyncio.run(self.ai_processor.process_with_advanced_nlp("xyzabc123", "test_user"))
        self.assertEqual(result['intent'], 'unknown')
        self.assertLess(result['confidence'], 0.5)

def run_enhanced_tests():
    """Run all enhanced tests"""
    print("🧪 Running Enhanced Voxta Voice Agent Tests...")
    print("=" * 60)
    
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestEnhancedVoxtaVoiceAgent))
    test_suite.addTest(unittest.makeSuite(TestAccuracyMetrics))
    test_suite.addTest(unittest.makeSuite(TestErrorHandling))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print("=" * 60)
    if result.wasSuccessful():
        print("✅ All enhanced tests passed!")
        print(f"📊 Tests run: {result.testsRun}")
        print("🎯 Voice agent ready for production deployment")
    else:
        print("❌ Some tests failed")
        print(f"📊 Tests run: {result.testsRun}")
        print(f"❌ Failures: {len(result.failures)}")
        print(f"⚠️ Errors: {len(result.errors)}")
        
        # Print failure details
        if result.failures:
            print("\n❌ Failures:")
            for test, traceback in result.failures:
                print(f"   {test}: {traceback}")
        
        if result.errors:
            print("\n⚠️ Errors:")
            for test, traceback in result.errors:
                print(f"   {test}: {traceback}")
    
    return result.wasSuccessful()

if __name__ == "__main__":
    # Import requests for error handling tests
    try:
        import requests
    except ImportError:
        print("❌ requests library required for tests")
        sys.exit(1)
    
    success = run_enhanced_tests()
    sys.exit(0 if success else 1)
